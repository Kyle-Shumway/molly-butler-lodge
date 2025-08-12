-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('ADMIN', 'STAFF');

-- CreateEnum
CREATE TYPE "public"."RoomType" AS ENUM ('historic', 'mountain-view', 'family-cabin');

-- CreateEnum
CREATE TYPE "public"."ReservationStatus" AS ENUM ('pending', 'confirmed', 'cancelled', 'completed', 'no-show');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('pending', 'paid', 'refunded');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "username" VARCHAR(30) NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL DEFAULT 'STAFF',
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."rooms" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."RoomType" NOT NULL,
    "description" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "basePrice" DECIMAL(10,2) NOT NULL,
    "amenities" TEXT[],
    "images" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "roomNumber" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reservations" (
    "id" TEXT NOT NULL,
    "guestFirstName" TEXT NOT NULL,
    "guestLastName" TEXT NOT NULL,
    "guestEmail" TEXT NOT NULL,
    "guestPhone" TEXT NOT NULL,
    "guestStreet" TEXT,
    "guestCity" TEXT,
    "guestState" TEXT,
    "guestZipCode" TEXT,
    "roomId" TEXT NOT NULL,
    "checkIn" TIMESTAMP(3) NOT NULL,
    "checkOut" TIMESTAMP(3) NOT NULL,
    "guests" INTEGER NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "status" "public"."ReservationStatus" NOT NULL DEFAULT 'pending',
    "paymentStatus" "public"."PaymentStatus" NOT NULL DEFAULT 'pending',
    "specialRequests" TEXT,
    "confirmationNumber" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "public"."users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "rooms_roomNumber_key" ON "public"."rooms"("roomNumber");

-- CreateIndex
CREATE INDEX "rooms_type_isActive_idx" ON "public"."rooms"("type", "isActive");

-- CreateIndex
CREATE INDEX "rooms_capacity_idx" ON "public"."rooms"("capacity");

-- CreateIndex
CREATE UNIQUE INDEX "reservations_confirmationNumber_key" ON "public"."reservations"("confirmationNumber");

-- CreateIndex
CREATE INDEX "reservations_checkIn_checkOut_idx" ON "public"."reservations"("checkIn", "checkOut");

-- CreateIndex
CREATE INDEX "reservations_guestEmail_idx" ON "public"."reservations"("guestEmail");

-- CreateIndex
CREATE INDEX "reservations_status_idx" ON "public"."reservations"("status");

-- CreateIndex
CREATE INDEX "reservations_roomId_checkIn_checkOut_idx" ON "public"."reservations"("roomId", "checkIn", "checkOut");

-- AddForeignKey
ALTER TABLE "public"."reservations" ADD CONSTRAINT "reservations_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "public"."rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
