import nodemailer from 'nodemailer';
import { Reservation, Room } from '@prisma/client';

type ReservationWithRoom = Reservation & {
  room: Room;
};

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// Send confirmation email
export const sendConfirmationEmail = async (reservation: ReservationWithRoom) => {
  try {
    const transporter = createTransporter();
    
    const checkInDate = reservation.checkIn.toLocaleDateString();
    const checkOutDate = reservation.checkOut.toLocaleDateString();
    const nights = Math.ceil((reservation.checkOut.getTime() - reservation.checkIn.getTime()) / (1000 * 60 * 60 * 24));
    
    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@mollybutterlodge.com',
      to: reservation.guestEmail,
      subject: `Reservation Confirmation - ${reservation.confirmationNumber}`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #8B4513; margin-bottom: 5px;">Molly Butler Lodge</h1>
            <p style="color: #666; font-style: italic;">Est. 1910</p>
          </div>
          
          <div style="background: #F4E4BC; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
            <h2 style="color: #8B4513; margin-top: 0;">Reservation Confirmed!</h2>
            <p style="font-size: 18px; margin-bottom: 10px;">
              <strong>Confirmation Number:</strong> ${reservation.confirmationNumber}
            </p>
          </div>

          <h3 style="color: #8B4513;">Guest Information</h3>
          <p><strong>Name:</strong> ${reservation.guestFirstName} ${reservation.guestLastName}</p>
          <p><strong>Email:</strong> ${reservation.guestEmail}</p>
          <p><strong>Phone:</strong> ${reservation.guestPhone}</p>

          <h3 style="color: #8B4513;">Reservation Details</h3>
          <p><strong>Room:</strong> ${reservation.room.name}</p>
          <p><strong>Check-in:</strong> ${checkInDate}</p>
          <p><strong>Check-out:</strong> ${checkOutDate}</p>
          <p><strong>Nights:</strong> ${nights}</p>
          <p><strong>Guests:</strong> ${reservation.guests}</p>
          <p><strong>Total Amount:</strong> $${Number(reservation.totalAmount).toFixed(2)}</p>

          ${reservation.specialRequests ? `
            <h3 style="color: #8B4513;">Special Requests</h3>
            <p style="font-style: italic;">${reservation.specialRequests}</p>
          ` : ''}

          <div style="background: #f8f8f8; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #8B4513; margin-top: 0;">Lodge Information</h3>
            <p><strong>Address:</strong> 109 Main Street, Greer, AZ 85927</p>
            <p><strong>Phone:</strong> (928) 735-7226</p>
            <p><strong>Check-in Time:</strong> 3:00 PM</p>
            <p><strong>Check-out Time:</strong> 11:00 AM</p>
          </div>

          <div style="border-top: 2px solid #D2691E; padding-top: 20px; margin-top: 30px; text-align: center;">
            <p style="color: #666;">
              We look forward to welcoming you to Arizona's Oldest Guest Lodge!<br>
              If you have any questions, please call us at (928) 735-7226.
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Confirmation email sent to ${reservation.guestEmail}`);
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    throw error;
  }
};

// Send cancellation email
export const sendCancellationEmail = async (reservation: ReservationWithRoom) => {
  try {
    const transporter = createTransporter();
    
    const checkInDate = reservation.checkIn.toLocaleDateString();
    const checkOutDate = reservation.checkOut.toLocaleDateString();
    
    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@mollybutterlodge.com',
      to: reservation.guestEmail,
      subject: `Reservation Cancellation - ${reservation.confirmationNumber}`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #8B4513; margin-bottom: 5px;">Molly Butler Lodge</h1>
            <p style="color: #666; font-style: italic;">Est. 1910</p>
          </div>
          
          <div style="background: #ffe6e6; padding: 20px; border-radius: 10px; margin-bottom: 20px; border-left: 4px solid #ff6b6b;">
            <h2 style="color: #d63031; margin-top: 0;">Reservation Cancelled</h2>
            <p style="font-size: 18px; margin-bottom: 10px;">
              <strong>Confirmation Number:</strong> ${reservation.confirmationNumber}
            </p>
          </div>

          <h3 style="color: #8B4513;">Cancelled Reservation Details</h3>
          <p><strong>Guest:</strong> ${reservation.guestFirstName} ${reservation.guestLastName}</p>
          <p><strong>Room:</strong> ${reservation.room.name}</p>
          <p><strong>Check-in:</strong> ${checkInDate}</p>
          <p><strong>Check-out:</strong> ${checkOutDate}</p>
          <p><strong>Total Amount:</strong> $${Number(reservation.totalAmount).toFixed(2)}</p>

          <div style="background: #f8f8f8; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #8B4513; margin-top: 0;">Refund Information</h3>
            <p>
              If you paid a deposit, we will process your refund according to our cancellation policy. 
              Please allow 5-7 business days for the refund to appear on your statement.
            </p>
            <p>
              If you have any questions about your refund or would like to make a new reservation, 
              please contact us at (928) 735-7226.
            </p>
          </div>

          <div style="border-top: 2px solid #D2691E; padding-top: 20px; margin-top: 30px; text-align: center;">
            <p style="color: #666;">
              We're sorry to see your plans change. We hope to welcome you to 
              Arizona's Oldest Guest Lodge in the future!
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Cancellation email sent to ${reservation.guestEmail}`);
  } catch (error) {
    console.error('Error sending cancellation email:', error);
    throw error;
  }
};

// Send reminder email (for upcoming reservations)
export const sendReminderEmail = async (reservation: ReservationWithRoom) => {
  try {
    const transporter = createTransporter();
    
    const checkInDate = reservation.checkIn.toLocaleDateString();
    
    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@mollybutterlodge.com',
      to: reservation.guestEmail,
      subject: `Upcoming Stay Reminder - ${reservation.confirmationNumber}`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #8B4513; margin-bottom: 5px;">Molly Butler Lodge</h1>
            <p style="color: #666; font-style: italic;">Est. 1910</p>
          </div>
          
          <div style="background: #e8f5e8; padding: 20px; border-radius: 10px; margin-bottom: 20px; border-left: 4px solid #27ae60;">
            <h2 style="color: #27ae60; margin-top: 0;">Your Stay is Coming Up!</h2>
            <p style="font-size: 18px; margin-bottom: 10px;">
              <strong>Check-in:</strong> ${checkInDate}
            </p>
            <p style="font-size: 18px;">
              <strong>Confirmation Number:</strong> ${reservation.confirmationNumber}
            </p>
          </div>

          <div style="background: #f8f8f8; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #8B4513; margin-top: 0;">Important Information</h3>
            <p><strong>Check-in Time:</strong> 3:00 PM</p>
            <p><strong>Address:</strong> 109 Main Street, Greer, AZ 85927</p>
            <p><strong>Phone:</strong> (928) 735-7226</p>
          </div>

          <h3 style="color: #8B4513;">What to Expect</h3>
          <ul style="color: #666; line-height: 1.6;">
            <li>Historic charm with modern amenities</li>
            <li>Complimentary Wi-Fi throughout the lodge</li>
            <li>On-site restaurant serving authentic mountain cuisine</li>
            <li>Beautiful White Mountains location</li>
          </ul>

          <div style="border-top: 2px solid #D2691E; padding-top: 20px; margin-top: 30px; text-align: center;">
            <p style="color: #666;">
              We're excited to welcome you to Arizona's Oldest Guest Lodge!<br>
              Safe travels, and we'll see you soon.
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Reminder email sent to ${reservation.guestEmail}`);
  } catch (error) {
    console.error('Error sending reminder email:', error);
    throw error;
  }
};