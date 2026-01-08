import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.FROM_EMAIL || 'CarsUY <noreply@carsuy.com>';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Email templates
const emailStyles = `
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 30px 0; }
    .logo { font-family: 'Arial Black', sans-serif; font-size: 32px; font-weight: 900; color: #0f172a; }
    .logo-divider { display: block; width: 100px; height: 3px; background: #75AADB; margin: 5px auto; border-radius: 2px; }
    .logo-uy { font-family: 'Helvetica Neue', sans-serif; font-size: 14px; font-weight: 600; letter-spacing: 6px; color: #75AADB; }
    .content { background: #f8fafc; border-radius: 16px; padding: 40px; margin: 20px 0; }
    .button { display: inline-block; background: linear-gradient(to right, #0ea5e9, #2563eb); color: white !important; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; margin: 20px 0; }
    .button:hover { background: linear-gradient(to right, #0284c7, #1d4ed8); }
    .footer { text-align: center; color: #64748b; font-size: 14px; padding: 20px 0; }
    .highlight { background: #e0f2fe; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .highlight strong { color: #0369a1; }
    h1 { color: #0f172a; margin-bottom: 16px; }
    p { color: #475569; margin: 12px 0; }
  </style>
`;

const logoHtml = `
  <div class="header">
    <div class="logo">CARS</div>
    <span class="logo-divider"></span>
    <div class="logo-uy">UY</div>
  </div>
`;

const footerHtml = `
  <div class="footer">
    <p>© ${new Date().getFullYear()} CarsUY. Software para automotoras.</p>
    <p>Este email fue enviado automáticamente. Por favor no respondas a este mensaje.</p>
  </div>
`;

// Registration confirmation email (when user submits registration)
export async function sendRegistrationConfirmation(
  email: string,
  companyName: string,
  subdomain: string
) {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>${emailStyles}</head>
      <body>
        <div class="container">
          ${logoHtml}
          <div class="content">
            <h1>¡Recibimos tu solicitud!</h1>
            <p>Gracias por registrar <strong>${companyName}</strong> en CarsUY.</p>
            <p>Estamos revisando tu solicitud y te notificaremos por email cuando tu cuenta esté lista.</p>
            <div class="highlight">
              <p><strong>Tu dirección será:</strong></p>
              <p style="font-size: 18px; font-weight: 600; color: #0369a1;">${subdomain}.carsuy.com</p>
            </div>
            <p>El proceso de aprobación generalmente toma 1-2 días hábiles.</p>
            <p>Si tenés alguna consulta, no dudes en contactarnos.</p>
          </div>
          ${footerHtml}
        </div>
      </body>
      </html>
    `;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Recibimos tu solicitud - CarsUY',
      html,
    });

    if (error) {
      console.error('Error sending registration confirmation email:', error);
      return { success: false, error };
    }

    console.log('Registration confirmation email sent:', data?.id);
    return { success: true, id: data?.id };
  } catch (error) {
    console.error('Error sending registration confirmation email:', error);
    return { success: false, error };
  }
}

// Account approved email (when super admin approves registration)
export async function sendAccountApproved(
  email: string,
  userName: string,
  companyName: string,
  subdomain: string
) {
  const loginUrl = `https://${subdomain}.carsuy.com/login`;

  try {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>${emailStyles}</head>
      <body>
        <div class="container">
          ${logoHtml}
          <div class="content">
            <h1>¡Tu cuenta está activa!</h1>
            <p>Hola <strong>${userName}</strong>,</p>
            <p>Tu cuenta de <strong>${companyName}</strong> ha sido aprobada y ya podés empezar a usar CarsUY.</p>
            <div class="highlight">
              <p><strong>Tu dirección de acceso:</strong></p>
              <p style="font-size: 18px; font-weight: 600; color: #0369a1;">${subdomain}.carsuy.com</p>
            </div>
            <p>Usá el email y contraseña que registraste para iniciar sesión.</p>
            <div style="text-align: center;">
              <a href="${loginUrl}" class="button">Iniciar Sesión</a>
            </div>
            <p>Si tenés alguna consulta, no dudes en contactarnos.</p>
          </div>
          ${footerHtml}
        </div>
      </body>
      </html>
    `;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: '¡Tu cuenta está activa! - CarsUY',
      html,
    });

    if (error) {
      console.error('Error sending account approved email:', error);
      return { success: false, error };
    }

    console.log('Account approved email sent:', data?.id);
    return { success: true, id: data?.id };
  } catch (error) {
    console.error('Error sending account approved email:', error);
    return { success: false, error };
  }
}

// Account rejected email
export async function sendAccountRejected(
  email: string,
  userName: string,
  companyName: string,
  reason?: string
) {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>${emailStyles}</head>
      <body>
        <div class="container">
          ${logoHtml}
          <div class="content">
            <h1>Actualización sobre tu solicitud</h1>
            <p>Hola <strong>${userName}</strong>,</p>
            <p>Lamentamos informarte que tu solicitud de registro para <strong>${companyName}</strong> no ha sido aprobada en este momento.</p>
            ${reason ? `
              <div class="highlight">
                <p><strong>Motivo:</strong></p>
                <p>${reason}</p>
              </div>
            ` : ''}
            <p>Si creés que esto fue un error o querés más información, por favor contactanos.</p>
            <p>Podés intentar registrarte nuevamente cuando lo desees.</p>
          </div>
          ${footerHtml}
        </div>
      </body>
      </html>
    `;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Actualización sobre tu solicitud - CarsUY',
      html,
    });

    if (error) {
      console.error('Error sending account rejected email:', error);
      return { success: false, error };
    }

    console.log('Account rejected email sent:', data?.id);
    return { success: true, id: data?.id };
  } catch (error) {
    console.error('Error sending account rejected email:', error);
    return { success: false, error };
  }
}

// Password reset email
export async function sendPasswordReset(
  email: string,
  userName: string,
  resetToken: string,
  subdomain?: string
) {
  // For tenant users, use subdomain URL; for super admin, use main URL
  const baseUrl = subdomain
    ? `https://${subdomain}.carsuy.com`
    : FRONTEND_URL;
  const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

  try {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>${emailStyles}</head>
      <body>
        <div class="container">
          ${logoHtml}
          <div class="content">
            <h1>Restablecer tu contraseña</h1>
            <p>Hola <strong>${userName}</strong>,</p>
            <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en CarsUY.</p>
            <p>Hacé click en el siguiente botón para crear una nueva contraseña:</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Restablecer Contraseña</a>
            </div>
            <p style="font-size: 13px; color: #64748b;">Este enlace expira en 1 hora.</p>
            <p style="font-size: 13px; color: #64748b;">Si no solicitaste restablecer tu contraseña, podés ignorar este email. Tu contraseña no será modificada.</p>
          </div>
          ${footerHtml}
        </div>
      </body>
      </html>
    `;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Restablecer tu contraseña - CarsUY',
      html,
    });

    if (error) {
      console.error('Error sending password reset email:', error);
      return { success: false, error };
    }

    console.log('Password reset email sent:', data?.id);
    return { success: true, id: data?.id };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error };
  }
}

// Welcome email for new users created by admin
export async function sendWelcomeEmail(
  email: string,
  userName: string,
  companyName: string,
  subdomain: string,
  temporaryPassword?: string
) {
  const loginUrl = `https://${subdomain}.carsuy.com/login`;

  try {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>${emailStyles}</head>
      <body>
        <div class="container">
          ${logoHtml}
          <div class="content">
            <h1>¡Bienvenido a ${companyName}!</h1>
            <p>Hola <strong>${userName}</strong>,</p>
            <p>Se ha creado una cuenta para vos en el sistema CarsUY de <strong>${companyName}</strong>.</p>
            <div class="highlight">
              <p><strong>Tus datos de acceso:</strong></p>
              <p>Email: <strong>${email}</strong></p>
              ${temporaryPassword ? `<p>Contraseña temporal: <strong>${temporaryPassword}</strong></p>` : ''}
              <p>URL: <strong>${subdomain}.carsuy.com</strong></p>
            </div>
            ${temporaryPassword ? '<p>Te recomendamos cambiar tu contraseña después de iniciar sesión por primera vez.</p>' : ''}
            <div style="text-align: center;">
              <a href="${loginUrl}" class="button">Iniciar Sesión</a>
            </div>
          </div>
          ${footerHtml}
        </div>
      </body>
      </html>
    `;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Bienvenido a ${companyName} - CarsUY`,
      html,
    });

    if (error) {
      console.error('Error sending welcome email:', error);
      return { success: false, error };
    }

    console.log('Welcome email sent:', data?.id);
    return { success: true, id: data?.id };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error };
  }
}
