import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { IUser } from '../models/User';
import { IJob } from '../models/Job';
import { ICompany } from '../models/Company';
import { IApplication } from '../models/Application';

export class PDFGenerator {
  private static ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  static async generateEmploymentContract(
    user: IUser,
    job: IJob,
    company: ICompany,
    application: IApplication
  ): Promise<string> {
    const doc = new PDFDocument();
    const fileName = `employment_contract_${user._id}_${Date.now()}.pdf`;
    const filePath = path.join(process.cwd(), 'uploads', 'generated', fileName);
    
    this.ensureDirectoryExists(path.dirname(filePath));
    doc.pipe(fs.createWriteStream(filePath));

    // Header
    doc.fontSize(20).text('EMPLOYMENT CONTRACT', { align: 'center' });
    doc.moveDown();

    // Company Information
    doc.fontSize(14).text('EMPLOYER INFORMATION', { underline: true });
    doc.fontSize(12)
       .text(`Company: ${company.companyName}`)
       .text(`Address: ${company.headquarters.address}, ${company.headquarters.city}`)
       .text(`Country: ${company.headquarters.country}`)
       .text(`Registration: ${company.registrationNumber}`)
       .moveDown();

    // Employee Information
    doc.fontSize(14).text('EMPLOYEE INFORMATION', { underline: true });
    doc.fontSize(12)
       .text(`Name: ${user.name}`)
       .text(`Email: ${user.email}`)
       .text(`Nationality: ${user.nationality || 'N/A'}`)
       .moveDown();

    // Job Details
    doc.fontSize(14).text('POSITION DETAILS', { underline: true });
    doc.fontSize(12)
       .text(`Position: ${job.title}`)
       .text(`Department: ${job.category}`)
       .text(`Salary: ${job.salary}`)
       .text(`Employment Type: ${job.type}`)
       .text(`Start Date: ${job.startDate?.toDateString() || 'To be determined'}`)
       .text(`Duration: ${job.contractDuration || 'Permanent'}`)
       .moveDown();

    // Terms and Conditions
    doc.fontSize(14).text('TERMS AND CONDITIONS', { underline: true });
    doc.fontSize(10)
       .text('1. The employee agrees to perform duties as assigned by the employer.')
       .text('2. Visa sponsorship and work permit will be provided by the employer.')
       .text('3. Accommodation assistance will be provided as per company policy.')
       .text('4. This contract is subject to local employment laws.')
       .moveDown();

    // Signatures
    doc.fontSize(12)
       .text('Employee Signature: _________________    Date: _________')
       .moveDown()
       .text('Employer Signature: _________________    Date: _________');

    doc.end();
    return fileName;
  }

  static async generateVisaInvitationLetter(
    user: IUser,
    job: IJob,
    company: ICompany
  ): Promise<string> {
    const doc = new PDFDocument();
    const fileName = `visa_invitation_${user._id}_${Date.now()}.pdf`;
    const filePath = path.join(process.cwd(), 'uploads', 'generated', fileName);
    
    this.ensureDirectoryExists(path.dirname(filePath));
    doc.pipe(fs.createWriteStream(filePath));

    // Header
    doc.fontSize(18).text('VISA INVITATION LETTER', { align: 'center' });
    doc.moveDown();

    // Date
    doc.fontSize(12).text(`Date: ${new Date().toDateString()}`, { align: 'right' });
    doc.moveDown();

    // To Embassy
    doc.text('To: The Visa Officer')
       .text(`Embassy/Consulate of ${company.headquarters.country}`)
       .moveDown();

    // Subject
    doc.fontSize(14).text('Subject: Employment Visa Invitation', { underline: true });
    doc.moveDown();

    // Body
    doc.fontSize(12)
       .text(`Dear Visa Officer,`)
       .moveDown()
       .text(`We, ${company.companyName}, hereby invite ${user.name} to work in our organization as ${job.title}.`)
       .moveDown()
       .text('Company Details:')
       .text(`- Company Name: ${company.companyName}`)
       .text(`- Registration Number: ${company.registrationNumber}`)
       .text(`- Address: ${company.headquarters.address}`)
       .text(`- Industry: ${company.industry}`)
       .moveDown()
       .text('Employee Details:')
       .text(`- Full Name: ${user.name}`)
       .text(`- Email: ${user.email}`)
       .text(`- Position: ${job.title}`)
       .text(`- Salary: ${job.salary}`)
       .moveDown()
       .text('We confirm that we will sponsor the work visa and provide necessary support for relocation.')
       .moveDown()
       .text('Sincerely,')
       .moveDown(2)
       .text('_________________')
       .text('HR Manager')
       .text(company.companyName);

    doc.end();
    return fileName;
  }

  static async generateWorkPermitLetter(
    user: IUser,
    job: IJob,
    company: ICompany
  ): Promise<string> {
    const doc = new PDFDocument();
    const fileName = `work_permit_${user._id}_${Date.now()}.pdf`;
    const filePath = path.join(process.cwd(), 'uploads', 'generated', fileName);
    
    this.ensureDirectoryExists(path.dirname(filePath));
    doc.pipe(fs.createWriteStream(filePath));

    // Header
    doc.fontSize(18).text('WORK PERMIT APPLICATION SUPPORT LETTER', { align: 'center' });
    doc.moveDown();

    // Content
    doc.fontSize(12)
       .text(`To Whom It May Concern,`)
       .moveDown()
       .text(`This letter serves as official confirmation that ${company.companyName} has offered employment to ${user.name} for the position of ${job.title}.`)
       .moveDown()
       .text('Employment Details:')
       .text(`- Position: ${job.title}`)
       .text(`- Salary: ${job.salary}`)
       .text(`- Employment Type: ${job.type}`)
       .text(`- Start Date: ${job.startDate?.toDateString() || 'Upon visa approval'}`)
       .moveDown()
       .text('We confirm our commitment to sponsor the work permit and comply with all immigration requirements.')
       .moveDown(3)
       .text('Authorized Signature: _________________')
       .text(`Company: ${company.companyName}`)
       .text(`Date: ${new Date().toDateString()}`);

    doc.end();
    return fileName;
  }

  static async generateAccommodationLetter(
    user: IUser,
    company: ICompany
  ): Promise<string> {
    const doc = new PDFDocument();
    const fileName = `accommodation_${user._id}_${Date.now()}.pdf`;
    const filePath = path.join(process.cwd(), 'uploads', 'generated', fileName);
    
    this.ensureDirectoryExists(path.dirname(filePath));
    doc.pipe(fs.createWriteStream(filePath));

    // Header
    doc.fontSize(18).text('ACCOMMODATION ARRANGEMENT LETTER', { align: 'center' });
    doc.moveDown();

    // Content
    doc.fontSize(12)
       .text(`Dear ${user.name},`)
       .moveDown()
       .text(`We are pleased to confirm accommodation arrangements for your relocation to ${company.headquarters.country}.`)
       .moveDown()
       .text('Accommodation Details:')
       .text('- Type: Furnished apartment/company housing')
       .text(`- Location: Near ${company.headquarters.city}`)
       .text('- Duration: Initial 3 months (extendable)')
       .text('- Utilities: Included')
       .moveDown()
       .text('Additional Support:')
       .text('- Airport pickup service')
       .text('- Local orientation program')
       .text('- Banking and documentation assistance')
       .moveDown()
       .text('Please contact our HR department for further details.')
       .moveDown(2)
       .text('Best regards,')
       .text('HR Department')
       .text(company.companyName);

    doc.end();
    return fileName;
  }

  static async generateOfferLetter(
    user: IUser,
    job: IJob,
    company: ICompany,
    offerDetails: any
  ): Promise<string> {
    const doc = new PDFDocument();
    const fileName = `offer_letter_${user._id}_${Date.now()}.pdf`;
    const filePath = path.join(process.cwd(), 'uploads', 'generated', fileName);
    
    this.ensureDirectoryExists(path.dirname(filePath));
    doc.pipe(fs.createWriteStream(filePath));

    // Header
    doc.fontSize(20).text('EMPLOYMENT OFFER LETTER', { align: 'center' });
    doc.moveDown();

    // Date
    doc.fontSize(12).text(`Date: ${new Date().toDateString()}`, { align: 'right' });
    doc.moveDown();

    // Recipient
    doc.text(`Dear ${user.name},`);
    doc.moveDown();

    // Offer content
    doc.text(`We are pleased to offer you the position of ${job.title} at ${company.companyName}.`);
    doc.moveDown();

    // Offer details
    doc.text('Offer Details:');
    doc.text(`- Position: ${job.title}`);
    doc.text(`- Salary: ${offerDetails.salary}`);
    doc.text(`- Start Date: ${new Date(offerDetails.startDate).toDateString()}`);
    doc.text(`- Benefits: ${offerDetails.benefits?.join(', ') || 'As per company policy'}`);
    doc.moveDown();

    // Terms
    doc.text('This offer is valid until: ' + new Date(offerDetails.expiryDate).toDateString());
    doc.moveDown();

    // Signature
    doc.text('Please sign and return this letter to confirm your acceptance.');
    doc.moveDown(2);
    doc.text('Sincerely,');
    doc.moveDown();
    doc.text('HR Department');
    doc.text(company.companyName);

    doc.end();
    return fileName;
  }

  static async generateAssessmentCertificate(
    user: IUser,
    job: IJob,
    score: number
  ): Promise<string> {
    const doc = new PDFDocument();
    const fileName = `assessment_certificate_${user._id}_${Date.now()}.pdf`;
    const filePath = path.join(process.cwd(), 'uploads', 'generated', fileName);
    
    this.ensureDirectoryExists(path.dirname(filePath));
    doc.pipe(fs.createWriteStream(filePath));

    // Header
    doc.fontSize(24).text('ASSESSMENT CERTIFICATE', { align: 'center' });
    doc.moveDown(2);

    // Certificate content
    doc.fontSize(16)
       .text('This is to certify that', { align: 'center' })
       .moveDown()
       .fontSize(20)
       .text(user.name, { align: 'center', underline: true })
       .moveDown()
       .fontSize(16)
       .text('has successfully completed the assessment for', { align: 'center' })
       .moveDown()
       .fontSize(18)
       .text(job.title, { align: 'center', underline: true })
       .moveDown(2)
       .fontSize(16)
       .text(`Score Achieved: ${score}%`, { align: 'center' })
       .text(`Pass Mark: ${job.assessmentCutoffScore}%`, { align: 'center' })
       .moveDown(3)
       .fontSize(12)
       .text(`Date: ${new Date().toDateString()}`, { align: 'center' })
       .moveDown(2)
       .text('_________________', { align: 'center' })
       .text('Assessment Authority', { align: 'center' });

    doc.end();
    return fileName;
  }
}