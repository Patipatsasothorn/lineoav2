-- เพิ่มคอลัมน์ userName ให้กับตาราง ArchivedConversations (ถ้ายังไม่มี)
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS
               WHERE TABLE_NAME = 'ArchivedConversations' AND COLUMN_NAME = 'userName')
BEGIN
    ALTER TABLE ArchivedConversations ADD userName NVARCHAR(255);
    PRINT 'Column userName added to ArchivedConversations';
END
ELSE
BEGIN
    PRINT 'Column userName already exists in ArchivedConversations';
END
GO

-- เพิ่มคอลัมน์ userName ให้กับตาราง ArchivedMessages (ถ้ายังไม่มี)
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS
               WHERE TABLE_NAME = 'ArchivedMessages' AND COLUMN_NAME = 'userName')
BEGIN
    ALTER TABLE ArchivedMessages ADD userName NVARCHAR(255);
    PRINT 'Column userName added to ArchivedMessages';
END
ELSE
BEGIN
    PRINT 'Column userName already exists in ArchivedMessages';
END
GO

PRINT 'Update completed!';
