-- รูปของบริการที่จริงๆ เป็นของชิ้นหนึ่ง (จุ๊บลม)
ALTER TABLE `Service`
  ADD COLUMN `publicId` VARCHAR(191) NULL,
  ADD COLUMN `secureUrl` VARCHAR(191) NULL;
