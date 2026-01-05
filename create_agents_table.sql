-- SQL Script to create the Agents table for LineOA v2
-- Run this in your MSSQL database

CREATE TABLE Agents (
    id NVARCHAR(50) PRIMARY KEY,
    name NVARCHAR(100),
    username NVARCHAR(100) NOT NULL,
    password NVARCHAR(100) NOT NULL,
    userId NVARCHAR(50) NOT NULL,
    createdAt DATETIME DEFAULT GETDATE(),
    isActive BIT DEFAULT 1,
    CONSTRAINT FK_Agents_Users FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE
);
GO

-- If you don't have the Users table yet or the structure is different, 
-- you might need to adjust the FK constraint.
