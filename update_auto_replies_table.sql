-- Update AutoReplies table to support message types and reply types
-- This script will add columns if they don't exist

USE LineOA;
GO

-- Check if messageType column exists, if not add it
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[AutoReplies]') AND name = 'messageType')
BEGIN
    ALTER TABLE [dbo].[AutoReplies]
    ADD messageType NVARCHAR(50) NULL DEFAULT 'text';

    PRINT 'Column messageType added successfully';
END
ELSE
BEGIN
    PRINT 'Column messageType already exists';
END
GO

-- Check if replyType column exists, if not add it
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[AutoReplies]') AND name = 'replyType')
BEGIN
    ALTER TABLE [dbo].[AutoReplies]
    ADD replyType NVARCHAR(50) NULL;

    PRINT 'Column replyType added successfully';
END
ELSE
BEGIN
    PRINT 'Column replyType already exists';
END
GO

-- Check if imageUrl column exists for storing image URLs, if not add it
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[AutoReplies]') AND name = 'imageUrl')
BEGIN
    ALTER TABLE [dbo].[AutoReplies]
    ADD imageUrl NVARCHAR(MAX) NULL;

    PRINT 'Column imageUrl added successfully';
END
ELSE
BEGIN
    PRINT 'Column imageUrl already exists';
END
GO

-- Check if stickerPackageId column exists, if not add it
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[AutoReplies]') AND name = 'stickerPackageId')
BEGIN
    ALTER TABLE [dbo].[AutoReplies]
    ADD stickerPackageId NVARCHAR(50) NULL;

    PRINT 'Column stickerPackageId added successfully';
END
ELSE
BEGIN
    PRINT 'Column stickerPackageId already exists';
END
GO

-- Check if stickerId column exists, if not add it
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[AutoReplies]') AND name = 'stickerId')
BEGIN
    ALTER TABLE [dbo].[AutoReplies]
    ADD stickerId NVARCHAR(50) NULL;

    PRINT 'Column stickerId added successfully';
END
ELSE
BEGIN
    PRINT 'Column stickerId already exists';
END
GO

-- Update existing records to have default messageType if NULL
UPDATE [dbo].[AutoReplies]
SET messageType = 'text'
WHERE messageType IS NULL;
GO

PRINT 'AutoReplies table structure updated successfully';
PRINT 'The table now supports:';
PRINT '- messageType: text, image, sticker';
PRINT '- replyType: for categorizing reply types';
PRINT '- imageUrl: for storing image URLs';
PRINT '- stickerPackageId and stickerId: for sticker replies';
GO
