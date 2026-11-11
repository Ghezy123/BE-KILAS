-- CreateTable
CREATE TABLE `users` (
    `user_id` CHAR(36) NOT NULL,
    `username` VARCHAR(30) NOT NULL,
    `email` VARCHAR(120) NOT NULL,
    `password_hash` VARCHAR(100) NOT NULL,
    `nama` VARCHAR(100) NOT NULL,
    `bio` VARCHAR(300) NULL,
    `foto_profil` VARCHAR(255) NULL,
    `fakultas` VARCHAR(100) NULL,
    `jurusan` VARCHAR(100) NULL,
    `pengingat_aktif` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `users_username_key`(`username`),
    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `device_tokens` (
    `token_id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `fcm_token` VARCHAR(255) NOT NULL,
    `platform` ENUM('android', 'ios') NOT NULL,
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `device_tokens_fcm_token_key`(`fcm_token`),
    INDEX `device_tokens_user_id_idx`(`user_id`),
    PRIMARY KEY (`token_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reports` (
    `report_id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `category` ENUM('kondisi_kampus', 'informasi_penting') NOT NULL,
    `title` VARCHAR(120) NOT NULL,
    `description` TEXT NOT NULL,
    `latitude` DECIMAL(9, 6) NOT NULL,
    `longitude` DECIMAL(9, 6) NOT NULL,
    `location_name` VARCHAR(150) NULL,
    `upvote_count` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `edited_at` DATETIME(3) NULL,

    INDEX `reports_user_id_created_at_idx`(`user_id`, `created_at`),
    INDEX `reports_category_created_at_idx`(`category`, `created_at`),
    INDEX `reports_created_at_idx`(`created_at`),
    INDEX `reports_upvote_count_idx`(`upvote_count`),
    PRIMARY KEY (`report_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `report_media` (
    `media_id` CHAR(36) NOT NULL,
    `report_id` CHAR(36) NOT NULL,
    `media_url` VARCHAR(255) NOT NULL,
    `media_type` ENUM('image', 'video') NOT NULL,
    `sort_order` TINYINT NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `report_media_report_id_sort_order_key`(`report_id`, `sort_order`),
    PRIMARY KEY (`media_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `upvotes` (
    `user_id` CHAR(36) NOT NULL,
    `report_id` CHAR(36) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `upvotes_report_id_created_at_idx`(`report_id`, `created_at`),
    PRIMARY KEY (`user_id`, `report_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bookmarks` (
    `user_id` CHAR(36) NOT NULL,
    `report_id` CHAR(36) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `bookmarks_user_id_created_at_idx`(`user_id`, `created_at`),
    INDEX `bookmarks_report_id_idx`(`report_id`),
    PRIMARY KEY (`user_id`, `report_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `notification_id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `type` ENUM('upvote_milestone', 'pengingat_harian') NOT NULL,
    `title` VARCHAR(120) NOT NULL,
    `body` TEXT NOT NULL,
    `report_id` CHAR(36) NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT false,
    `dedupe_key` VARCHAR(120) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `notifications_dedupe_key_key`(`dedupe_key`),
    INDEX `notifications_user_id_is_read_idx`(`user_id`, `is_read`),
    INDEX `notifications_user_id_created_at_idx`(`user_id`, `created_at`),
    PRIMARY KEY (`notification_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `activity_logs` (
    `activity_id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `action_type` ENUM('buat_laporan', 'ubah_laporan', 'hapus_laporan') NOT NULL,
    `report_id` CHAR(36) NULL,
    `report_title` VARCHAR(120) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `activity_logs_user_id_created_at_idx`(`user_id`, `created_at`),
    INDEX `activity_logs_user_id_action_type_created_at_idx`(`user_id`, `action_type`, `created_at`),
    PRIMARY KEY (`activity_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `device_tokens` ADD CONSTRAINT `device_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_media` ADD CONSTRAINT `report_media_report_id_fkey` FOREIGN KEY (`report_id`) REFERENCES `reports`(`report_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `upvotes` ADD CONSTRAINT `upvotes_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `upvotes` ADD CONSTRAINT `upvotes_report_id_fkey` FOREIGN KEY (`report_id`) REFERENCES `reports`(`report_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookmarks` ADD CONSTRAINT `bookmarks_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookmarks` ADD CONSTRAINT `bookmarks_report_id_fkey` FOREIGN KEY (`report_id`) REFERENCES `reports`(`report_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_report_id_fkey` FOREIGN KEY (`report_id`) REFERENCES `reports`(`report_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activity_logs` ADD CONSTRAINT `activity_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activity_logs` ADD CONSTRAINT `activity_logs_report_id_fkey` FOREIGN KEY (`report_id`) REFERENCES `reports`(`report_id`) ON DELETE SET NULL ON UPDATE CASCADE;
