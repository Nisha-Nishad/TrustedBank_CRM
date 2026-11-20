const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding comprehensive 20-customer bank CRM dataset...');
  const now = Date.now();

  // 1. Clean all tables in proper cascade order
  await prisma.activityLog.deleteMany();
  await prisma.note.deleteMany();
  await prisma.task.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.kycDocument.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  const nishaPasswordHash = await bcrypt.hash('#dev@Free', 10);
  const defaultPasswordHash = await bcrypt.hash('Password@123', 10);

  // 2. Administrators & Managers
  const adminNisha = await prisma.user.create({
    data: {
      name: 'Nisha Nishad',
      email: 'ernishanishad@gmail.com',
      passwordHash: nishaPasswordHash,
      role: 'ADMIN',
      isActive: true,
    },
  });

  const adminBackup = await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@trustbank.in',
      passwordHash: defaultPasswordHash,
      role: 'ADMIN',
      isActive: true,
    },
  });

  const manager = await prisma.user.create({
    data: {
      name: 'Rahul Sharma (Branch Manager)',
      email: 'manager@trustbank.in',
      passwordHash: defaultPasswordHash,
      role: 'MANAGER',
      isActive: true,
    },
  });

  // 3. 10 Relationship Managers (RMs)
  const rmList = [
    { name: 'Amit Mishra (RM-1)', email: 'rep1@trustbank.in' },
    { name: 'Neha Kapoor (RM-2)', email: 'rep2@trustbank.in' },
    { name: 'Vikram Singh (RM-3)', email: 'vikram.singh@trustbank.in' },
    { name: 'Priya Sharma (RM-4)', email: 'priya.sharma@trustbank.in' },
    { name: 'Rajesh Gupta (RM-5)', email: 'rajesh.gupta@trustbank.in' },
    { name: 'Ananya Patel (RM-6)', email: 'ananya.patel@trustbank.in' },
    { name: 'Rohit Verma (RM-7)', email: 'rohit.verma@trustbank.in' },
    { name: 'Sneha Reddy (RM-8)', email: 'sneha.reddy@trustbank.in' },
    { name: 'Manish Joshi (RM-9)', email: 'manish.joshi@trustbank.in' },
    { name: 'Kavita Nair (RM-10)', email: 'kavita.nair@trustbank.in' },
  ];

  const rms = [];
  for (const rm of rmList) {
    const created = await prisma.user.create({
      data: {
        name: rm.name,
        email: rm.email,
        passwordHash: defaultPasswordHash,
        role: 'SALES_REP',
        isActive: true,
      },
    });
    rms.push(created);
  }

  console.log(`Created 2 Admins, 1 Manager, and ${rms.length} Relationship Managers.`);

  // 4. 20 Realistic Customers across India
  const customerRawData = [
    { name: 'Rajesh Kumar Verma', phone: '+91 98102 33451', email: 'rajesh.verma@corp.in', city: 'New Delhi', address: 'Plot 42, Sector 15, Dwarka', type: 'INDIVIDUAL', rmIndex: 0 },
    { name: 'Mehta Transports LLP', phone: '+91 99200 44551', email: 'contact@mehtatrans.com', city: 'Mumbai', address: 'Andheri Industrial Area', type: 'BUSINESS', rmIndex: 1 },
    { name: 'Suresh K. Agarwal', phone: '+91 98210 55667', email: 'suresh.agarwal@gmail.com', city: 'Kolkata', address: 'Park Street, Suite 4A', type: 'INDIVIDUAL', rmIndex: 2 },
    { name: 'Priya Nair', phone: '+91 98860 12345', email: 'priya.nair@techlead.in', city: 'Bengaluru', address: 'Indiranagar 100ft Road', type: 'INDIVIDUAL', rmIndex: 3 },
    { name: 'Apex Agro Industries Pvt Ltd', phone: '+91 94220 88991', email: 'finance@apexagro.in', city: 'Pune', address: 'MIDC Bhosari', type: 'BUSINESS', rmIndex: 7 },
    { name: 'Vikramaditya Singhania', phone: '+91 98290 77123', email: 'singhania@rajasthanventures.com', city: 'Jaipur', address: 'Civil Lines, C-Scheme', type: 'INDIVIDUAL', rmIndex: 9 },
    { name: 'Dr. Ananya Sharma', phone: '+91 98111 22334', email: 'dr.ananya@citycare.org', city: 'New Delhi', address: 'Vasant Vihar, Block C', type: 'INDIVIDUAL', rmIndex: 0 },
    { name: 'GreenLeaf Organics Ltd', phone: '+91 97250 44321', email: 'accounts@greenleafltd.com', city: 'Ahmedabad', address: 'SG Highway Business Park', type: 'BUSINESS', rmIndex: 4 },
    { name: 'Kavita Krishnamurthy', phone: '+91 94440 99882', email: 'kavita.k@chennaicorp.com', city: 'Chennai', address: 'T. Nagar, Anna Salai', type: 'INDIVIDUAL', rmIndex: 3 },
    { name: 'Rohit Deshmukh', phone: '+91 98201 44321', email: 'rohit.deshmukh@infra.in', city: 'Mumbai', address: 'Bandra Kurla Complex (BKC)', type: 'INDIVIDUAL', rmIndex: 1 },
    { name: 'Zenith Healthcare Solutions', phone: '+91 98490 66778', email: 'procurement@zenithhealth.in', city: 'Hyderabad', address: 'Hitec City, Phase 2', type: 'BUSINESS', rmIndex: 5 },
    { name: 'Alok Sen', phone: '+91 98300 55443', email: 'alok.sen@architecture.org', city: 'Kolkata', address: 'Salt Lake Sector 5', type: 'INDIVIDUAL', rmIndex: 2 },
    { name: 'Sunita Narain', phone: '+91 98112 34567', email: 'sunita.narain@ecocouncil.in', city: 'New Delhi', address: 'Lodhi Estate', type: 'INDIVIDUAL', rmIndex: 0 },
    { name: 'Falcon Security & Facilities', phone: '+91 98140 33221', email: 'operations@falconsec.in', city: 'Chandigarh', address: 'Sector 34-A Commercial Belt', type: 'BUSINESS', rmIndex: 6 },
    { name: 'Deepak Malhotra', phone: '+91 94150 77889', email: 'deepak.malhotra@gov.in', city: 'Lucknow', address: 'Gomti Nagar Extension', type: 'INDIVIDUAL', rmIndex: 8 },
    { name: 'Shree Balaji Textiles Pvt Ltd', phone: '+91 98251 66554', email: 'directors@balajitex.com', city: 'Surat', address: 'Ring Road Textile Market', type: 'BUSINESS', rmIndex: 4 },
    { name: 'Pooja Venkatesh', phone: '+91 97112 88920', email: 'pooja.v@outlook.com', city: 'Bengaluru', address: 'Koramangala 4th Block', type: 'INDIVIDUAL', rmIndex: 3 },
    { name: 'Matrix Infotech Systems', phone: '+91 98180 99112', email: 'treasury@matrixinfotech.in', city: 'Noida', address: 'Sector 62 IT Corridor', type: 'BUSINESS', rmIndex: 5 },
    { name: 'Harish Chandra Joshi', phone: '+91 94120 88776', email: 'hc.joshi.defence@gmail.com', city: 'Dehradun', address: 'Rajpur Road', type: 'INDIVIDUAL', rmIndex: 8 },
    { name: 'Royal Heritage Hotels & Resorts', phone: '+91 94141 55667', email: 'reservations@royalheritageudaipur.com', city: 'Udaipur', address: 'Fateh Sagar Lake Road', type: 'BUSINESS', rmIndex: 9 },
  ];

  const createdCustomers = [];
  for (const c of customerRawData) {
    const cust = await prisma.customer.create({
      data: {
        name: c.name,
        phone: c.phone,
        email: c.email,
        address: c.address,
        city: c.city,
        type: c.type,
        createdById: rms[c.rmIndex].id,
      },
    });
    createdCustomers.push({ ...cust, rmIndex: c.rmIndex });
  }

  console.log(`Created ${createdCustomers.length} Customers distributed across 10 RMs.`);

  // 5. Distributed Deals across all 7 stages
  const dealsData = [
    { title: 'Rajesh Verma - Premium Home Loan', amount: 5000000, stage: 'APPROVED', custIndex: 0 },
    { title: 'Mehta Transports - Commercial Fleet Expansion', amount: 3500000, stage: 'WON', custIndex: 1 },
    { title: 'Suresh Agarwal - Working Capital Overdraft', amount: 7500000, stage: 'VERIFICATION', custIndex: 2 },
    { title: 'Priya Nair - Luxury Electric Vehicle Loan', amount: 2500000, stage: 'APPROVED', custIndex: 3 },
    { title: 'Apex Agro - Grain Processing Unit Line', amount: 12000000, stage: 'DOCUMENTS', custIndex: 4 },
    { title: 'Vikramaditya Singhania - Commercial Complex Mortgage', amount: 25000000, stage: 'WON', custIndex: 5 },
    { title: 'Dr. Ananya Sharma - Clinic Setup Term Loan', amount: 4000000, stage: 'CONTACTED', custIndex: 6 },
    { title: 'GreenLeaf Organics - Export Working Capital', amount: 6000000, stage: 'VERIFICATION', custIndex: 7 },
    { title: 'Kavita Krishnamurthy - Home Renovation Loan', amount: 3000000, stage: 'DOCUMENTS', custIndex: 8 },
    { title: 'Rohit Deshmukh - Sea-Facing 3BHK Apartment Loan', amount: 4500000, stage: 'NEW', custIndex: 9 },
    { title: 'Zenith Healthcare - MRI Imaging Machine Finance', amount: 18000000, stage: 'APPROVED', custIndex: 10 },
    { title: 'Alok Sen - Studio Office Renovation Loan', amount: 1500000, stage: 'WON', custIndex: 11 },
    { title: 'Sunita Narain - Solar Rooftop Green Energy Facility', amount: 2000000, stage: 'CONTACTED', custIndex: 12 },
    { title: 'Falcon Security - Surveillance Fleet Asset Loan', amount: 5500000, stage: 'DOCUMENTS', custIndex: 13 },
    { title: 'Deepak Malhotra - Residential Plot Sanction', amount: 3500000, stage: 'VERIFICATION', custIndex: 14 },
    { title: 'Shree Balaji Textiles - High-Speed Loom Finance', amount: 20000000, stage: 'WON', custIndex: 15 },
    { title: 'Pooja Venkatesh - Mid-Size SUV Auto Loan', amount: 1800000, stage: 'WON', custIndex: 16 },
    { title: 'Matrix Infotech - Enterprise Cloud Infrastructure Line', amount: 9000000, stage: 'NEW', custIndex: 17 },
    { title: 'Harish Chandra Joshi - Gold Loan for Family Occasion', amount: 1200000, stage: 'APPROVED', custIndex: 18 },
    { title: 'Royal Heritage Hotels - Lakeview Resort Wing Expansion', amount: 32000000, stage: 'DOCUMENTS', custIndex: 19 },
    { title: 'Kiran Patel - Commercial Property Acquisition', amount: 7500000, stage: 'LOST', custIndex: 4 },
  ];

  const loanTypes = ['HOME_LOAN', 'PERSONAL_LOAN', 'BUSINESS_LOAN', 'AUTO_LOAN', 'GOLD_LOAN', 'EDUCATION_LOAN'];
  const approvalStatuses = ['APPROVED', 'SUBMITTED_FOR_APPROVAL', 'DRAFT', 'APPROVED', 'SUBMITTED_FOR_APPROVAL'];

  for (let i = 0; i < dealsData.length; i++) {
    const d = dealsData[i];
    const cust = createdCustomers[d.custIndex];
    const loanType = loanTypes[i % loanTypes.length];
    const approvalStatus = approvalStatuses[i % approvalStatuses.length];

    await prisma.deal.create({
      data: {
        title: d.title,
        amount: d.amount,
        stage: d.stage,
        customerId: cust.id,
        ownerId: rms[cust.rmIndex].id,
        closedAt: d.stage === 'WON' || d.stage === 'LOST' ? new Date() : null,
        loanType,
        tenureMonths: loanType === 'HOME_LOAN' ? 240 : 60,
        interestRate: loanType === 'HOME_LOAN' ? 8.5 : 12.0,
        monthlyIncome: 120000,
        eligibilityStatus: 'ELIGIBLE',
        eligibilityNotes: 'Estimated EMI within 50% FOIR threshold',
        approvalStatus,
        submittedAt: approvalStatus !== 'DRAFT' ? new Date(now - 86400000) : null,
        approvedById: approvalStatus === 'APPROVED' ? manager.id : null,
        approvedAt: approvalStatus === 'APPROVED' ? new Date(now - 3600000) : null,
        approvalNotes: approvalStatus === 'APPROVED' ? 'Sanctioned after thorough credit & risk check' : null,
      },
    });
  }

  // 6. Distributed Tasks across Today, Upcoming, Overdue, and Completed
  const tasksData = [
    { title: 'Call Mr. Verma - Home Loan Doc collection', type: 'CALL', dueOffsetHours: 2, status: 'PENDING', custIndex: 0 },
    { title: 'KYC Verification - Priya Patel', type: 'MEETING', dueOffsetHours: 4, status: 'PENDING', custIndex: 3 },
    { title: 'Follow up - Car Loan Inquiry (A. Kapoor)', type: 'CALL', dueOffsetHours: 5, status: 'PENDING', custIndex: 9 },
    { title: 'Review Credit Score - S. Nair', type: 'FOLLOW_UP', dueOffsetHours: 6, status: 'PENDING', custIndex: 12 },
    { title: 'Schedule physical site inspection for Property Mortgage', type: 'MEETING', dueOffsetHours: 24, status: 'PENDING', custIndex: 5 },
    { title: 'Verify GST returns and bank statements for Apex Agro', type: 'EMAIL', dueOffsetHours: 48, status: 'PENDING', custIndex: 4 },
    { title: 'Draft Sanction Letter for Zenith Healthcare', type: 'FOLLOW_UP', dueOffsetHours: 72, status: 'PENDING', custIndex: 10 },
    { title: 'Collect balance ITR computation from Deepak Malhotra', type: 'CALL', dueOffsetHours: -24, status: 'PENDING', custIndex: 14 },
    { title: 'Send loan disbursement agreement to Mehta Transports', type: 'EMAIL', dueOffsetHours: -2, status: 'COMPLETED', custIndex: 1 },
    { title: 'Issue Sanction Letter to Shree Balaji Textiles', type: 'EMAIL', dueOffsetHours: -6, status: 'COMPLETED', custIndex: 15 },
  ];

  for (const t of tasksData) {
    const cust = createdCustomers[t.custIndex];
    await prisma.task.create({
      data: {
        title: t.title,
        type: t.type,
        dueDate: new Date(now + t.dueOffsetHours * 3600000),
        status: t.status,
        relatedType: 'CUSTOMER',
        relatedId: cust.id,
        assignedToId: rms[cust.rmIndex].id,
      },
    });
  }

  // 7. Distributed Notes across customers
  const notesData = [
    { content: 'Sanction letter issued. Customer satisfied with 8.40% interest rate and 20-year tenure.', custIndex: 0 },
    { content: 'All 8 commercial vehicle registration certificates (RC) submitted for hypothecation.', custIndex: 1 },
    { content: 'Chartered Accountant audited balance sheet submitted. Credit score 810.', custIndex: 2 },
    { content: 'Form 16 verified. Pre-approved for instant disbursement upon dealer invoice.', custIndex: 3 },
    { content: 'Factory premises valuation completed by empaneled bank valuer.', custIndex: 4 },
    { content: 'Customer transferred initial margin deposit into TrustBank Current Account.', custIndex: 5 },
  ];

  for (const n of notesData) {
    const cust = createdCustomers[n.custIndex];
    await prisma.note.create({
      data: {
        content: n.content,
        relatedType: 'CUSTOMER',
        relatedId: cust.id,
        createdById: rms[cust.rmIndex].id,
      },
    });
  }

  // 8. Distributed Leads
  const leadsData = [
    { name: 'Rohit Deshmukh', phone: '+91 98201 44321', email: 'rohit.d@gmail.com', source: 'BRANCH', productInterest: 'Home Loan (₹50 Lakh)', status: 'CONTACTED', rmIndex: 0 },
    { name: 'Pooja Venkatesh', phone: '+91 97112 88920', email: 'pooja.v@outlook.com', source: 'WEBSITE', productInterest: 'Auto Loan (₹18 Lakh)', status: 'NEW', rmIndex: 1 },
    { name: 'Alok Sen', phone: '+91 98450 67123', email: 'alok.sen@techcorp.com', source: 'REFERRAL', productInterest: 'Personal Loan (₹8 Lakh)', status: 'QUALIFIED', rmIndex: 2 },
    { name: 'Sunita Narain', phone: '+91 98112 99881', email: 'sunita.n@ecocorp.in', source: 'BRANCH', productInterest: 'Commercial Property Loan (₹1.2 Cr)', status: 'NEW', rmIndex: 3 },
    { name: 'Gaurav Jain', phone: '+91 98200 11998', email: 'gaurav.jain@jaintrade.in', source: 'CALL', productInterest: 'Business Working Capital (₹35 Lakh)', status: 'CONTACTED', rmIndex: 4 },
    { name: 'Sneha Joshi', phone: '+91 98765 44332', email: 'sneha.j@startuphub.in', source: 'WEBSITE', productInterest: 'Business Loan (₹18 Lakh)', status: 'NEW', rmIndex: 5 },
  ];

  for (const l of leadsData) {
    await prisma.lead.create({
      data: {
        name: l.name,
        phone: l.phone,
        email: l.email,
        source: l.source,
        productInterest: l.productInterest,
        status: l.status,
        assignedToId: rms[l.rmIndex].id,
      },
    });
  }

  // 9. Activity Logs for recent timeline
  await prisma.activityLog.create({
    data: {
      userId: manager.id,
      action: 'STAGE_CHANGE',
      entityType: 'DEAL',
      entityId: createdCustomers[0].id,
      details: 'Deal approved for Rohit Mehta (₹45 Lakh Home Loan)',
      createdAt: new Date(now - 1000 * 60 * 18),
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: rms[5].id,
      action: 'CREATE',
      entityType: 'LEAD',
      entityId: createdCustomers[1].id,
      details: 'New lead assigned: Sneha Joshi (₹18 Lakh Business Loan)',
      createdAt: new Date(now - 1000 * 60 * 65),
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: rms[3].id,
      action: 'UPDATE',
      entityType: 'CUSTOMER',
      entityId: createdCustomers[3].id,
      details: 'KYC documents verified for Priya Patel',
      createdAt: new Date(now - 1000 * 60 * 105),
    },
  });

  // 10. Seed Phase 2 KYC Documents for first 5 customers
  const sampleKyc = [
    { documentType: 'PAN', documentNumber: 'ABCDE1234F', status: 'VERIFIED', custIndex: 0 },
    { documentType: 'AADHAAR', documentNumber: '987654321098', status: 'VERIFIED', custIndex: 0 },
    { documentType: 'SALARY_SLIP', documentNumber: 'SLIP-OCT-2026', status: 'VERIFIED', custIndex: 0 },
    { documentType: 'PAN', documentNumber: 'BCDEF2345G', status: 'VERIFIED', custIndex: 1 },
    { documentType: 'ITR', documentNumber: 'ITR-AY2627', status: 'VERIFIED', custIndex: 1 },
    { documentType: 'PAN', documentNumber: 'CDEFG3456H', status: 'PENDING', custIndex: 2 },
    { documentType: 'AADHAAR', documentNumber: '556677889900', status: 'PENDING', custIndex: 2 },
    { documentType: 'PASSPORT', documentNumber: 'Z8765432', status: 'VERIFIED', custIndex: 3 },
  ];

  for (const doc of sampleKyc) {
    const cust = createdCustomers[doc.custIndex];
    await prisma.kycDocument.create({
      data: {
        customerId: cust.id,
        documentType: doc.documentType,
        documentNumber: doc.documentNumber,
        status: doc.status,
        verifiedById: doc.status === 'VERIFIED' ? manager.id : null,
        verifiedAt: doc.status === 'VERIFIED' ? new Date() : null,
      },
    });
  }

  // Update customer overall KYC status
  await prisma.customer.update({ where: { id: createdCustomers[0].id }, data: { kycStatus: 'VERIFIED', monthlyIncome: 150000, cibilScore: 780 } });
  await prisma.customer.update({ where: { id: createdCustomers[1].id }, data: { kycStatus: 'VERIFIED', monthlyIncome: 200000, cibilScore: 810 } });
  await prisma.customer.update({ where: { id: createdCustomers[2].id }, data: { kycStatus: 'PENDING', monthlyIncome: 95000, cibilScore: 710 } });
  await prisma.customer.update({ where: { id: createdCustomers[3].id }, data: { kycStatus: 'VERIFIED', monthlyIncome: 180000, cibilScore: 795 } });

  // 11. Seed Phase 2 Support & Complaints Tickets
  const ticketsData = [
    {
      ticketNumber: 'TICK-1001',
      title: 'Delayed Home Loan Sanction Letter Dispatch',
      description: 'Customer requesting expedited release of sanction letter for registrar registry.',
      priority: 'URGENT',
      category: 'LOAN',
      status: 'OPEN',
      slaHours: 24,
      custIndex: 0,
    },
    {
      ticketNumber: 'TICK-1002',
      title: 'Commercial Current Account Cheque Book Re-issue',
      description: 'Personalized 50-leaf cheque book requested at Nariman Point branch.',
      priority: 'MEDIUM',
      category: 'GENERAL',
      status: 'IN_PROGRESS',
      slaHours: 72,
      custIndex: 1,
    },
    {
      ticketNumber: 'TICK-1003',
      title: 'UPI Transaction Debit Discrepancy on Merchant POS',
      description: 'Amount ₹14,500 debited twice during card swipe. Reversal requested.',
      priority: 'HIGH',
      category: 'TRANSACTION',
      status: 'RESOLVED',
      slaHours: 48,
      custIndex: 2,
    },
    {
      ticketNumber: 'TICK-1004',
      title: 'International Card Usage Activation for Dubai Travel',
      description: 'Customer travelling next week, requested international POS and contactless limits enabled.',
      priority: 'LOW',
      category: 'CARD',
      status: 'OPEN',
      slaHours: 120,
      custIndex: 3,
    },
  ];

  for (const t of ticketsData) {
    const cust = createdCustomers[t.custIndex];
    await prisma.ticket.create({
      data: {
        ticketNumber: t.ticketNumber,
        customerId: cust.id,
        assignedToId: rms[cust.rmIndex].id,
        title: t.title,
        description: t.description,
        priority: t.priority,
        category: t.category,
        status: t.status,
        dueDate: new Date(now + t.slaHours * 3600000),
        resolutionNotes: t.status === 'RESOLVED' ? 'Reversal credited back to savings account within 24 hours.' : null,
        resolvedAt: t.status === 'RESOLVED' ? new Date() : null,
      },
    });
  }

  console.log('Seeding of 20 customers with full banking field distribution, KYC documents, and Support Tickets completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
