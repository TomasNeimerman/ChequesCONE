USE [ChequesEmpresa2]
GO
/****** Object:  Table [dbo].[Cheque]    Script Date: 13/9/2024 17:52:09 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Cheque](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[nroCheque] [int] NOT NULL,
 CONSTRAINT [PK_Cheque] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
SET IDENTITY_INSERT [dbo].[Cheque] ON 

INSERT [dbo].[Cheque] ([id], [nroCheque]) VALUES (1, 54235)
INSERT [dbo].[Cheque] ([id], [nroCheque]) VALUES (2, 52352)
INSERT [dbo].[Cheque] ([id], [nroCheque]) VALUES (3, 6876)
INSERT [dbo].[Cheque] ([id], [nroCheque]) VALUES (4, 44765)
INSERT [dbo].[Cheque] ([id], [nroCheque]) VALUES (5, 76548769)
INSERT [dbo].[Cheque] ([id], [nroCheque]) VALUES (6, 786876)
INSERT [dbo].[Cheque] ([id], [nroCheque]) VALUES (7, 743573457)
INSERT [dbo].[Cheque] ([id], [nroCheque]) VALUES (8, 623466324)
SET IDENTITY_INSERT [dbo].[Cheque] OFF
GO
