const {
  getBangkokDateKey,
  getBangkokDayRange,
  getMinutesInBangkok,
  formatThaiDateLabel,
  formatThaiTimeLabel,
  formatThaiDateTime,
} = require("./time");

const SUMMARY_TITLE = "📋 สรุปเวลาเข้า-เลิกงาน";
const EMPLOYEE_SELECT = { id: true, fullName: true, nickname: true };
const ATTENDANCE_SELECT = { employeeId: true, status: true, scanTime: true };

const SUMMARY_ROW_CONFIGS = [
  { label: "ตรงเวลา", color: "#1DAB47", key: "onTime", withCount: true },
  { label: "ขาด/ลา", color: "#B00020", key: "absent" },
  { label: "มาสาย", color: "#A35A00", key: "late" },
  { label: "พักเกินเวลา", color: "#6A1B9A", key: "lunchOvertime" },
];

const sectionStyle = {
  date: { backgroundColor: "#F4FDF7", textColor: "#1DAB47", margin: "xl" },
  time: { backgroundColor: "#FFF8F0", textColor: "#FF6B35", margin: "md" },
};

const buildText = (text, overrides = {}) => ({
  type: "text",
  text,
  ...overrides,
});

const buildSummaryListText = (items) =>
  items.length
    ? items
        .slice(0, 15)
        .map((name) => `• ${name}`)
        .join("\n")
    : "- ไม่มี";

const buildSummaryRow = ({
  label,
  value,
  valueColor = "#111111",
  valueSize = "md",
  margin,
}) => ({
  type: "box",
  layout: "horizontal",
  spacing: "lg",
  ...(margin ? { margin } : {}),
  contents: [
    {
      type: "text",
      text: label,
      color: "#8C8C8C",
      size: "md",
      flex: 3,
    },
    {
      type: "text",
      text: value,
      color: valueColor,
      size: valueSize,
      weight: "bold",
      wrap: true,
      flex: 7,
    },
  ],
});

const buildInfoSection = ({ label, style, suffix = "" }) => ({
  type: "box",
  layout: "vertical",
  margin: style.margin,
  backgroundColor: style.backgroundColor,
  paddingAll: "16px",
  cornerRadius: "8px",
  alignItems: "center",
  contents: [
    buildText(`${label}${suffix}`, {
      size: "md",
      color: style.textColor,
      weight: "bold",
      wrap: true,
      margin: "sm",
    }),
  ],
});

const buildSummaryFooter = (thaiDateText, thaiTimeText) => [
  {
    type: "separator",
    margin: "xl",
    color: "#EBEBEB",
  },
  buildInfoSection({
    label: `วันที่ ${thaiDateText}`,
    style: sectionStyle.date,
  }),
  buildInfoSection({
    label: `เวลา ${thaiTimeText}`,
    style: sectionStyle.time,
    suffix: " น.",
  }),
];

const buildSummaryBubble = (thaiDateText, thaiTimeText, rows) => ({
  type: "flex",
  altText: `สรุปเวลาเข้างาน วันที่ ${thaiDateText}`,
  contents: {
    type: "bubble",
    size: "mega",
    header: {
      type: "box",
      layout: "vertical",
      backgroundColor: "#1DAB47",
      paddingTop: "16px",
      paddingBottom: "16px",
      paddingAll: "12px",
      contents: [
        buildText(SUMMARY_TITLE, {
          color: "#FFFFFF",
          weight: "bold",
          size: "md",
        }),
      ],
    },
    body: {
      type: "box",
      layout: "vertical",
      paddingAll: "20px",
      contents: [...rows, ...buildSummaryFooter(thaiDateText, thaiTimeText)],
    },
  },
});

const buildSummaryRows = ({ totalEmployees, stats }) => [
  buildSummaryRow({
    label: "พนักงาน",
    value: `${totalEmployees} คน`,
  }),
  ...SUMMARY_ROW_CONFIGS.map(({ label, color, key, withCount }) => {
    const listText = buildSummaryListText(stats[key]);
    return buildSummaryRow({
      label,
      value: withCount ? `${stats[key].length} คน\n${listText}` : listText,
      valueColor: color,
      valueSize: "sm",
      margin: "md",
    });
  }),
];

const buildDailyAttendanceSummaryMessage = async (
  prisma,
  getEmployeeDisplayName,
  dateKey,
) => {
  const { start, end } = getBangkokDayRange(dateKey);
  const thaiDateText = formatThaiDateLabel(start);
  const thaiTimeText = formatThaiTimeLabel(new Date());

  const employees = await prisma.employee.findMany({
    where: { isActive: true },
    orderBy: [{ fullName: "asc" }, { id: "asc" }],
    select: EMPLOYEE_SELECT,
  });

  if (!employees.length) {
    return buildSummaryBubble(thaiDateText, thaiTimeText, [
      buildSummaryRow({
        label: "พนักงาน",
        value: "0 คน",
      }),
      buildSummaryRow({
        label: "ตรงเวลา",
        value: "0 คน",
        valueColor: "#1DAB47",
        valueSize: "sm",
        margin: "md",
      }),
      buildSummaryRow({
        label: "หมายเหตุ",
        value: "ไม่มีรายชื่อพนักงานที่ใช้งานอยู่",
        margin: "md",
      }),
    ]);
  }

  const employeeIds = employees.map((employee) => employee.id);
  const attendances = await prisma.attendance.findMany({
    where: {
      employeeId: { in: employeeIds },
      scanTime: {
        gte: start,
        lte: end,
      },
    },
    select: ATTENDANCE_SELECT,
    orderBy: {
      scanTime: "asc",
    },
  });

  const grouped = new Map(
    employees.map((employee) => [
      employee.id,
      {
        ...employee,
        firstInWork: null,
        lunchOvertimeStatus: null,
      },
    ]),
  );

  for (const attendance of attendances) {
    const item = grouped.get(attendance.employeeId);
    if (!item) continue;

    if (attendance.status.startsWith("เข้างาน") && !item.firstInWork) {
      item.firstInWork = attendance;
    }

    const isLunchReturn = attendance.status.startsWith("กลับจากพักเที่ยง");
    const isOvertimeLunch =
      attendance.status.includes("สาย") ||
      attendance.status.includes("พักเกินเวลา");

    if (isLunchReturn && isOvertimeLunch && !item.lunchOvertimeStatus) {
      item.lunchOvertimeStatus = attendance.status;
    }
  }

  const stats = {
    absent: [],
    onTime: [],
    late: [],
    lunchOvertime: [],
  };

  for (const employee of grouped.values()) {
    if (!employee.firstInWork) {
      stats.absent.push(getEmployeeDisplayName(employee));
      continue;
    }

    const employeeName = getEmployeeDisplayName(employee);
    const isLate = employee.firstInWork.status.startsWith("เข้างาน (สาย");

    if (isLate) {
      stats.late.push(`${employeeName} - ${employee.firstInWork.status}`);
    } else {
      stats.onTime.push(employeeName);
    }

    if (employee.lunchOvertimeStatus) {
      stats.lunchOvertime.push(
        `${employeeName} - ${employee.lunchOvertimeStatus}`,
      );
    }
  }

  return buildSummaryBubble(
    thaiDateText,
    thaiTimeText,
    buildSummaryRows({ totalEmployees: employees.length, stats }),
  );
};

const createDailySummarySender = (sendLineMessage, buildSummaryMessage) => {
  let lastSentDateKey = "";
  let running = false;

  return async () => {
    if (running) return;

    const now = new Date();
    const dateKey = getBangkokDateKey(now);
    const currentMinutes = getMinutesInBangkok(now);

    if (currentMinutes < 18 * 60 || lastSentDateKey === dateKey) {
      return;
    }

    running = true;

    try {
      const message = await buildSummaryMessage(dateKey);
      await sendLineMessage(message);
      lastSentDateKey = dateKey;
    } catch (error) {
      console.error("Failed to send daily summary:", error.message);
    } finally {
      running = false;
    }
  };
};

const formatAttendanceMessage = (empName, empId, scanStatus, recordTime) => {
  const thaiDateTime = formatThaiDateTime(recordTime);
  const [dateOnly = thaiDateTime, timePart = ""] =
    String(thaiDateTime).split(" เวลา ");
  const timeOnly = timePart || "-";
  const isLunchStatus =
    scanStatus.startsWith("พักเที่ยง") ||
    scanStatus.startsWith("กลับจากพักเที่ยง");
  const headerTitle = isLunchStatus
    ? "🍱 บันทึกเวลาพักเที่ยง"
    : "⏰ บันทึกเวลาเข้า-เลิกงาน";
  const headerBackgroundColor = isLunchStatus ? "#FF8A00" : "#1DAB47";
  const detailRows = [
    { label: "รหัส", value: empId || "-" },
    { label: "พนักงาน", value: empName },
    { label: "สถานะ", value: scanStatus },
  ];

  return {
    type: "flex",
    altText: `⏰ ${scanStatus}: ${empName}`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: headerBackgroundColor,
        paddingTop: "16px",
        paddingBottom: "16px",
        paddingAll: "12px",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "text",
                text: headerTitle,
                size: "md",
                weight: "bold",
                color: "#ffffff",
                gravity: "center",
              },
            ],
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "20px",
        contents: [
          ...detailRows.map((row, index) =>
            buildSummaryRow({
              label: row.label,
              value: row.value,
              margin: index ? "md" : undefined,
            }),
          ),
          {
            type: "separator",
            margin: "xl",
            color: "#EBEBEB",
          },
          buildInfoSection({
            label: `วันที่ ${dateOnly}`,
            style: sectionStyle.date,
          }),
          buildInfoSection({
            label: `เวลา ${timeOnly}`,
            style: sectionStyle.time,
          }),
        ],
      },
    },
  };
};

module.exports = {
  formatAttendanceMessage,
  buildDailyAttendanceSummaryMessage,
  createDailySummarySender,
};
