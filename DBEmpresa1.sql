USE [ChequesEmpresa1]
GO
/****** Object:  Table [dbo].[Cheque]    Script Date: 13/9/2024 17:51:42 ******/
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

INSERT [dbo].[Cheque] ([id], [nroCheque]) VALUES (1, 56785678)
INSERT [dbo].[Cheque] ([id], [nroCheque]) VALUES (2, 34574357)
INSERT [dbo].[Cheque] ([id], [nroCheque]) VALUES (3, 63462346)
INSERT [dbo].[Cheque] ([id], [nroCheque]) VALUES (4, 34573457)
INSERT [dbo].[Cheque] ([id], [nroCheque]) VALUES (5, 765468345)
INSERT [dbo].[Cheque] ([id], [nroCheque]) VALUES (6, 743573457)
SET IDENTITY_INSERT [dbo].[Cheque] OFF
GO
