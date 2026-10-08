-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'PARTICIPANT');

-- CreateEnum
CREATE TYPE "ExamType" AS ENUM ('UTBK', 'TKA');

-- CreateEnum
CREATE TYPE "AccessTier" AS ENUM ('FREE', 'PREMIUM');

-- CreateEnum
CREATE TYPE "AttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'EXPIRED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "role" "Role" NOT NULL DEFAULT 'PARTICIPANT',
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tryout" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "examType" "ExamType" NOT NULL,
    "accessTier" "AccessTier" NOT NULL DEFAULT 'PREMIUM',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tryout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subtest" (
    "id" TEXT NOT NULL,
    "tryoutId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "durationSeconds" INTEGER NOT NULL,

    CONSTRAINT "Subtest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "subtestId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "stimulus" TEXT,
    "stem" TEXT NOT NULL,
    "explanation" TEXT,
    "weight" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionOption" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "QuestionOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tryoutId" TEXT NOT NULL,
    "status" "AttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "autoSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "score" DOUBLE PRECISION,

    CONSTRAINT "Attempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttemptSection" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "subtestId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3),
    "deadline" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "score" DOUBLE PRECISION,

    CONSTRAINT "AttemptSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttemptAnswer" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "selectedOptionId" TEXT,
    "isFlagged" BOOLEAN NOT NULL DEFAULT false,
    "isCorrect" BOOLEAN,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttemptAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "snapToken" TEXT,
    "midtransTransactionId" TEXT,
    "paymentType" TEXT,
    "rawNotification" JSONB,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE INDEX "Verification_identifier_idx" ON "Verification"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "Tryout_slug_key" ON "Tryout"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Subtest_tryoutId_order_key" ON "Subtest"("tryoutId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "Question_subtestId_order_key" ON "Question"("subtestId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionOption_questionId_label_key" ON "QuestionOption"("questionId", "label");

-- CreateIndex
CREATE INDEX "Attempt_tryoutId_status_score_idx" ON "Attempt"("tryoutId", "status", "score");

-- CreateIndex
CREATE UNIQUE INDEX "Attempt_userId_tryoutId_key" ON "Attempt"("userId", "tryoutId");

-- CreateIndex
CREATE UNIQUE INDEX "AttemptSection_attemptId_subtestId_key" ON "AttemptSection"("attemptId", "subtestId");

-- CreateIndex
CREATE UNIQUE INDEX "AttemptAnswer_attemptId_questionId_key" ON "AttemptAnswer"("attemptId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_orderId_key" ON "Payment"("orderId");

-- CreateIndex
CREATE INDEX "Payment_userId_idx" ON "Payment"("userId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subtest" ADD CONSTRAINT "Subtest_tryoutId_fkey" FOREIGN KEY ("tryoutId") REFERENCES "Tryout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_subtestId_fkey" FOREIGN KEY ("subtestId") REFERENCES "Subtest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionOption" ADD CONSTRAINT "QuestionOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_tryoutId_fkey" FOREIGN KEY ("tryoutId") REFERENCES "Tryout"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttemptSection" ADD CONSTRAINT "AttemptSection_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "Attempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttemptSection" ADD CONSTRAINT "AttemptSection_subtestId_fkey" FOREIGN KEY ("subtestId") REFERENCES "Subtest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttemptAnswer" ADD CONSTRAINT "AttemptAnswer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "Attempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttemptAnswer" ADD CONSTRAINT "AttemptAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttemptAnswer" ADD CONSTRAINT "AttemptAnswer_selectedOptionId_fkey" FOREIGN KEY ("selectedOptionId") REFERENCES "QuestionOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
