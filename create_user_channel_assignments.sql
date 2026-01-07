-- Create user_channel_assignments table with correct NVARCHAR(50) data types

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[user_channel_assignments]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[user_channel_assignments] (
        id INT IDENTITY(1,1) PRIMARY KEY,
        userId NVARCHAR(50) NOT NULL,
        channelId NVARCHAR(50) NOT NULL,
        assignedBy NVARCHAR(50) NOT NULL,
        createdAt DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_UserChannelAssignments_UserId FOREIGN KEY (userId) REFERENCES [dbo].[users](id) ON DELETE CASCADE,
        CONSTRAINT FK_UserChannelAssignments_ChannelId FOREIGN KEY (channelId) REFERENCES [dbo].[channels](id) ON DELETE CASCADE,
        CONSTRAINT FK_UserChannelAssignments_AssignedBy FOREIGN KEY (assignedBy) REFERENCES [dbo].[users](id),
        CONSTRAINT UQ_UserChannel UNIQUE (userId, channelId)
    );
END
GO
