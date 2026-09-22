-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "industry" TEXT,
    "website" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "linkedinUrl" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "title" TEXT,
    "industry" TEXT,
    "location" TEXT,
    "profileText" TEXT,
    "workHistory" TEXT,
    "recentPosts" TEXT,
    "notes" TEXT,
    "source" TEXT,
    "status" TEXT NOT NULL DEFAULT 'CANDIDATE',
    "overallScore" INTEGER,
    "customerScore" INTEGER,
    "partnerScore" INTEGER,
    "priority" TEXT,
    "isCustomerLead" BOOLEAN NOT NULL DEFAULT false,
    "isPartnerLead" BOOLEAN NOT NULL DEFAULT false,
    "nextActionDate" TIMESTAMP(3),
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileAnalysis" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "customerScore" INTEGER NOT NULL,
    "partnerScore" INTEGER NOT NULL,
    "priority" TEXT NOT NULL,
    "reasons" TEXT NOT NULL,
    "painPoints" TEXT NOT NULL,
    "valueProps" TEXT NOT NULL,
    "talkingPoints" TEXT NOT NULL,
    "cautions" TEXT,
    "missingInfo" TEXT,
    "suggestedInfo" TEXT,
    "genericWarning" BOOLEAN NOT NULL DEFAULT false,
    "rawResponse" TEXT NOT NULL,
    "modelUsed" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfileAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageDraft" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "variant" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "editedContent" TEXT,
    "profileSnapshot" TEXT NOT NULL,
    "checkResult" TEXT,
    "adopted" BOOLEAN NOT NULL DEFAULT false,
    "modelUsed" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT,
    "content" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FollowUp" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "memo" TEXT,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FollowUp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_name_key" ON "Company"("name");

-- CreateIndex
CREATE INDEX "Lead_status_idx" ON "Lead"("status");

-- CreateIndex
CREATE INDEX "Lead_priority_idx" ON "Lead"("priority");

-- CreateIndex
CREATE INDEX "Lead_overallScore_idx" ON "Lead"("overallScore");

-- CreateIndex
CREATE INDEX "Lead_nextActionDate_idx" ON "Lead"("nextActionDate");

-- CreateIndex
CREATE INDEX "Lead_createdAt_idx" ON "Lead"("createdAt");

-- CreateIndex
CREATE INDEX "ProfileAnalysis_leadId_idx" ON "ProfileAnalysis"("leadId");

-- CreateIndex
CREATE INDEX "MessageDraft_leadId_idx" ON "MessageDraft"("leadId");

-- CreateIndex
CREATE INDEX "MessageDraft_type_idx" ON "MessageDraft"("type");

-- CreateIndex
CREATE INDEX "Activity_leadId_idx" ON "Activity"("leadId");

-- CreateIndex
CREATE INDEX "Activity_type_idx" ON "Activity"("type");

-- CreateIndex
CREATE INDEX "FollowUp_leadId_idx" ON "FollowUp"("leadId");

-- CreateIndex
CREATE INDEX "FollowUp_dueDate_idx" ON "FollowUp"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "AppSetting_key_key" ON "AppSetting"("key");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileAnalysis" ADD CONSTRAINT "ProfileAnalysis_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageDraft" ADD CONSTRAINT "MessageDraft_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
