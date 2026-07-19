-- CreateTable
CREATE TABLE "AdminSettings" (
    "id" TEXT NOT NULL,
    "canManageUsers" BOOLEAN NOT NULL DEFAULT false,
    "canManageContent" BOOLEAN NOT NULL DEFAULT false,
    "canManageBilling" BOOLEAN NOT NULL DEFAULT false,
    "canManageSettings" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AdminSettings_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AdminSettings" ADD CONSTRAINT "AdminSettings_id_fkey" FOREIGN KEY ("id") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
