import PDFDocument from 'pdfkit';
import InstitutionSettings from '../models/InstitutionSettings.js';

/** Derive a short letterhead code (e.g. "OLM") from the institution name. */
function deriveInstitutionCode(name) {
  const initials = String(name || '')
    .split(/\s+/)
    .map((word) => word.replace(/[^A-Za-z0-9]/g, '')[0])
    .filter(Boolean)
    .join('')
    .slice(0, 6)
    .toUpperCase();
  return initials || 'INST';
}

/**
 * Generates an official, formal PDF document for a leave application and pipes
 * it to a writable stream (e.g. Express res).
 *
 * @param {Object} application - LeaveApplication document or object
 * @param {stream.Writable} outputStream - Stream to pipe PDF into
 */
export async function generateLeaveApplicationPdf(application, outputStream) {
  const settings = await InstitutionSettings.getSettings();
  const institutionName = settings.institutionName || 'Online Leave Management System';
  const institutionCode = settings.institutionCode || deriveInstitutionCode(institutionName);

  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 50, bottom: 50, left: 55, right: 55 },
    info: {
      Title: `Leave Application - ${application.applicationId}`,
      Author: institutionName,
      Subject: `Formal Leave Application for ${application.applicantNameSnapshot || 'Applicant'}`,
      Keywords: 'leave, application, formal letter, approval',
      CreationDate: new Date(),
    },
  });

  doc.pipe(outputStream);

  const primaryColor = '#182848';
  const slateColor = '#475569';
  const lightBorder = '#cbd5e1';

  // 1. Header Banner / Letterhead
  doc
    .fillColor(primaryColor)
    .fontSize(16)
    .font('Helvetica-Bold')
    .text(institutionName.toUpperCase(), { align: 'center' });

  doc
    .fillColor(slateColor)
    .fontSize(9)
    .font('Helvetica')
    .text(`INSTITUTION CODE: ${institutionCode} • ACADEMIC LEAVE PORTAL`, { align: 'center' })
    .moveDown(0.4);

  // Decorative header divider line
  const left = 55;
  const right = 595 - 55;
  let currentY = doc.y;
  doc
    .strokeColor(primaryColor)
    .lineWidth(1.5)
    .moveTo(left, currentY)
    .lineTo(right, currentY)
    .stroke();

  doc.moveDown(0.8);

  // 2. Document Title & Application ID
  doc
    .fillColor(primaryColor)
    .fontSize(13)
    .font('Helvetica-Bold')
    .text('OFFICIAL LEAVE APPLICATION & DECISION RECORD', { align: 'center' })
    .moveDown(0.2);

  doc
    .fillColor('#2563eb')
    .fontSize(10)
    .font('Helvetica-Bold')
    .text(`APPLICATION ID: ${application.applicationId}`, { align: 'center' })
    .moveDown(0.8);

  // 3. Metadata Summary Box
  const boxTop = doc.y;
  const boxWidth = right - left;
  const boxHeight = 100;

  doc
    .roundedRect(left, boxTop, boxWidth, boxHeight, 6)
    .fillAndStroke('#f8fafc', lightBorder);

  // Column 1
  const col1X = left + 14;
  let textY = boxTop + 12;

  doc.fillColor(slateColor).font('Helvetica').fontSize(9).text('Applicant Name:', col1X, textY);
  doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(9).text(application.applicantNameSnapshot || '—', col1X + 85, textY);

  textY += 16;
  doc.fillColor(slateColor).font('Helvetica').fontSize(9).text('Role & Dept:', col1X, textY);
  const roleDisplay = `${(application.applicantRoleSnapshot || '').toUpperCase()} (${application.departmentSnapshot || 'General'})`;
  doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(9).text(roleDisplay, col1X + 85, textY);

  textY += 16;
  doc.fillColor(slateColor).font('Helvetica').fontSize(9).text('Identifier:', col1X, textY);
  doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(9).text(application.applicantIdSnapshot || '—', col1X + 85, textY);

  textY += 16;
  doc.fillColor(slateColor).font('Helvetica').fontSize(9).text('Submitted On:', col1X, textY);
  const submittedDate = application.submittedAt ? new Date(application.submittedAt).toLocaleDateString('en-GB') : '—';
  doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(9).text(submittedDate, col1X + 85, textY);

  // Column 2
  const col2X = left + 260;
  textY = boxTop + 12;

  doc.fillColor(slateColor).font('Helvetica').fontSize(9).text('Leave Duration:', col2X, textY);
  doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(9).text(`${application.startDate} to ${application.endDate}`, col2X + 85, textY);

  textY += 16;
  doc.fillColor(slateColor).font('Helvetica').fontSize(9).text('Counted Days:', col2X, textY);
  doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(9).text(`${application.requestedPolicyDays || application.requestedCalendarDays} days (${application.requestedCalendarDays} calendar)`, col2X + 85, textY);

  textY += 16;
  doc.fillColor(slateColor).font('Helvetica').fontSize(9).text('Application Status:', col2X, textY);
  const status = application.status || 'Pending';
  const statusColor = status === 'Approved' ? '#059669' : status === 'Rejected' ? '#dc2626' : '#d97706';
  doc.fillColor(statusColor).font('Helvetica-Bold').fontSize(10).text(status.toUpperCase(), col2X + 85, textY);

  textY += 16;
  doc.fillColor(slateColor).font('Helvetica').fontSize(9).text('Decision Date:', col2X, textY);
  const decDate = application.decisionAt ? new Date(application.decisionAt).toLocaleDateString('en-GB') : 'Pending Review';
  doc.fillColor(primaryColor).font('Helvetica').fontSize(9).text(decDate, col2X + 85, textY);

  doc.y = boxTop + boxHeight + 16;

  // 4. Decision Callout (If Rejected or Approved with Note)
  if (status === 'Rejected' && application.rejectionReason) {
    const rejTop = doc.y;
    doc.roundedRect(left, rejTop, boxWidth, 40, 4).fillAndStroke('#fef2f2', '#fecaca');
    doc.fillColor('#b91c1c').font('Helvetica-Bold').fontSize(9).text('REJECTION REASON:', left + 10, rejTop + 8);
    doc.fillColor('#7f1d1d').font('Helvetica').fontSize(9).text(application.rejectionReason, left + 10, rejTop + 20, { width: boxWidth - 20 });
    doc.y = rejTop + 48;
  } else if (application.decisionNote) {
    const noteTop = doc.y;
    doc.roundedRect(left, noteTop, boxWidth, 36, 4).fillAndStroke('#f0fdf4', '#bbf7d0');
    doc.fillColor('#15803d').font('Helvetica-Bold').fontSize(9).text('ADMINISTRATOR DECISION NOTE:', left + 10, noteTop + 8);
    doc.fillColor('#166534').font('Helvetica').fontSize(9).text(application.decisionNote, left + 10, noteTop + 20, { width: boxWidth - 20 });
    doc.y = noteTop + 44;
  }

  // 5. Formal Letter Content
  doc
    .fillColor(primaryColor)
    .font('Helvetica-Bold')
    .fontSize(11)
    .text('FORMAL APPLICATION LETTER', left, doc.y)
    .moveDown(0.4);

  // Border container for letter body
  const letterBodyTop = doc.y;
  const content = application.letterContent || application.purpose || 'No formal letter text recorded.';

  doc
    .fillColor('#1e293b')
    .font('Helvetica')
    .fontSize(10)
    .lineGap(3)
    .text(content, left + 12, letterBodyTop + 12, {
      width: boxWidth - 24,
      align: 'justify',
    });

  const letterBodyBottom = doc.y + 12;
  const actualLetterHeight = Math.max(letterBodyBottom - letterBodyTop, 90);

  // Draw outline box around letter
  doc
    .roundedRect(left, letterBodyTop, boxWidth, actualLetterHeight, 4)
    .strokeColor('#e2e8f0')
    .lineWidth(1)
    .stroke();

  doc.y = letterBodyTop + actualLetterHeight + 25;

  // Check if we need space for signatures; if close to bottom, add page
  if (doc.y > 660) {
    doc.addPage();
    doc.y = 70;
  }

  // 6. Signature Endorsements
  const sigY = doc.y;
  const sigWidth = 180;

  // Applicant Signature
  doc
    .strokeColor(slateColor)
    .lineWidth(0.8)
    .moveTo(left + 10, sigY + 30)
    .lineTo(left + 10 + sigWidth, sigY + 30)
    .stroke();

  doc
    .fillColor(primaryColor)
    .font('Helvetica-Bold')
    .fontSize(9)
    .text(application.applicantNameSnapshot || 'Applicant Signature', left + 10, sigY + 34, { width: sigWidth, align: 'center' });

  doc
    .fillColor(slateColor)
    .font('Helvetica')
    .fontSize(8)
    .text('Applicant Digital Submission', left + 10, sigY + 46, { width: sigWidth, align: 'center' });

  // Authority Signature
  const authX = right - sigWidth - 10;
  doc
    .strokeColor(slateColor)
    .lineWidth(0.8)
    .moveTo(authX, sigY + 30)
    .lineTo(authX + sigWidth, sigY + 30)
    .stroke();

  doc
    .fillColor(primaryColor)
    .font('Helvetica-Bold')
    .fontSize(9)
    .text('Institutional Authority', authX, sigY + 34, { width: sigWidth, align: 'center' });

  doc
    .fillColor(slateColor)
    .font('Helvetica')
    .fontSize(8)
    .text(`Status: ${status} (${decDate})`, authX, sigY + 46, { width: sigWidth, align: 'center' });

  // 7. Official Document Verification Footer
  const footerY = 780;
  doc
    .strokeColor(lightBorder)
    .lineWidth(0.5)
    .moveTo(left, footerY)
    .lineTo(right, footerY)
    .stroke();

  doc
    .fillColor('#94a3b8')
    .font('Helvetica')
    .fontSize(7.5)
    .text(
      `Official verification record generated on ${new Date().toUTCString()} • Document ID: ${application.applicationId} • LeaveHub Core`,
      left,
      footerY + 6,
      { align: 'center', width: boxWidth }
    );

  doc.end();
}
