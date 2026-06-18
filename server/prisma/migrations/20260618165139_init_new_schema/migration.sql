-- CreateEnum
CREATE TYPE "TokenStatus" AS ENUM ('WAITING', 'CALLED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Receptionist" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Receptionist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QueueToken" (
    "id" TEXT NOT NULL,
    "tokenNumber" INTEGER NOT NULL,
    "patientName" TEXT NOT NULL,
    "patientPhone" TEXT NOT NULL,
    "status" "TokenStatus" NOT NULL DEFAULT 'WAITING',
    "date" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QueueToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QueueSettings" (
    "id" TEXT NOT NULL,
    "currentToken" INTEGER NOT NULL DEFAULT 0,
    "lastIssuedToken" INTEGER NOT NULL DEFAULT 0,
    "resetDate" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QueueSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Receptionist_username_key" ON "Receptionist"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Department_code_key" ON "Department"("code");

-- CreateIndex
CREATE INDEX "QueueToken_date_departmentId_tokenNumber_idx" ON "QueueToken"("date", "departmentId", "tokenNumber");

-- CreateIndex
CREATE UNIQUE INDEX "QueueToken_tokenNumber_date_departmentId_key" ON "QueueToken"("tokenNumber", "date", "departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "QueueSettings_departmentId_key" ON "QueueSettings"("departmentId");

-- AddForeignKey
ALTER TABLE "QueueToken" ADD CONSTRAINT "QueueToken_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QueueSettings" ADD CONSTRAINT "QueueSettings_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
