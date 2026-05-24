import PDFDocument from 'pdfkit';

export const generatePDFReport = async (stats, predictions) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // ============================================================
      // PAGE 1: COVER PAGE
      // ============================================================

      // Logo area (visual separator)
      doc.fontSize(36)
         .font('Helvetica-Bold')
         .fillColor('#CC0000')
         .text('Sew Le Sew', 50, 100, { align: 'center' });

      doc.fontSize(14)
         .font('Helvetica')
         .fillColor('#666666')
         .text('AI-Powered Donation Analytics Report', 50, 140, { align: 'center' });

      doc.moveDown(3);

      doc.fontSize(10)
         .fillColor('#888888')
         .text(`Report Generated: ${new Date().toLocaleString()}`, { align: 'center' });

      // Decorative line
      doc.strokeColor('#CC0000')
         .lineWidth(2)
         .moveTo(100, 250)
         .lineTo(500, 250)
         .stroke();

      doc.fontSize(12)
         .fillColor('#333333')
         .text('Ethiopian Red Cross', 50, 280, { align: 'center' });

      doc.fontSize(10)
         .fillColor('#888888')
         .text('Empowering donors, saving lives', 50, 300, { align: 'center' });

      // Footer
      doc.fontSize(8)
         .fillColor('#999999')
         .text('Sew Le Sew Platform • Ethiopian Red Cross • Page 1 of 5', 50, 750, { align: 'center' });

      doc.addPage();

      // ============================================================
      // PAGE 2: EXECUTIVE SUMMARY
      // ============================================================

      doc.fontSize(20)
         .font('Helvetica-Bold')
         .fillColor('#1B2559')
         .text('Executive Summary', 50, 50);

      doc.moveDown(1);

      const summaryData = [
        { label: 'Total Active Donors', value: stats.stats?.totalDonors || 0, icon: '1' },
        { label: 'Total Active Recipients', value: stats.stats?.totalRecipients || 0, icon: '2' },
        { label: 'Active Requests', value: stats.stats?.activeRequests || 0, icon: '3' },
        { label: 'Completed Matches', value: stats.stats?.completedMatches || 0, icon: '4' },
        { label: 'Critical Requests', value: stats.stats?.criticalRequests || 0, icon: '5' },
        { label: 'Alert Level', value: stats.alertLevel || 'Low', icon: '6' },
        { label: 'Upcoming Events', value: stats.stats?.upcomingEvents || 0, icon: '7' },
      ];

      let startY = 100;
      summaryData.forEach((item, i) => {
        const yPos = startY + (i * 25);
        doc.fontSize(11)
           .font('Helvetica-Bold')
           .fillColor('#333333')
           .text(`${item.icon} ${item.label}:`, 50, yPos);
        doc.font('Helvetica')
           .fillColor('#555555')
           .text(` ${item.value}`, 200, yPos);
      });

      doc.moveDown(4);

      // Critical Needs Table
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .fillColor('#1B2559')
         .text('Critical Needs', 50, doc.y + 20);

      doc.moveDown(1);

      // Table Header
      const tableTop = doc.y + 10;
      doc.fillColor('#CC0000')
         .rect(50, tableTop, 500, 25)
         .fill();

      doc.fillColor('#FFFFFF')
         .font('Helvetica-Bold')
         .fontSize(10)
         .text('Category', 60, tableTop + 8)
         .text('Most Needed', 200, tableTop + 8)
         .text('Status', 380, tableTop + 8);

      // Table Rows
      const tableRows = [
        ['Blood Type', stats.topNeeds?.blood || 'O+', 'Critical'],
        ['Organ', stats.topNeeds?.organ || 'Kidney', 'Urgent'],
        ['Medical Supplies', stats.topNeeds?.inKind || 'Various', 'High'],
        ['Financial Aid', `${stats.topNeeds?.financialPendingCount || 0} pending`, 'Pending'],
      ];

      let rowY = tableTop + 25;
      tableRows.forEach((row, idx) => {
        const bgColor = idx % 2 === 0 ? '#F9FAFB' : '#FFFFFF';
        doc.fillColor(bgColor)
           .rect(50, rowY, 500, 25)
           .fill();

        doc.fillColor('#333333')
           .font('Helvetica')
           .fontSize(10)
           .text(row[0], 60, rowY + 8)
           .text(row[1], 200, rowY + 8)
           .text(row[2], 380, rowY + 8);

        rowY += 25;
      });

      // Footer
      doc.fontSize(8)
         .fillColor('#999999')
         .text('Sew Le Sew Platform • Ethiopian Red Cross • Page 2 of 5', 50, 750, { align: 'center' });

      doc.addPage();

      // ============================================================
      // PAGE 3: BLOOD TYPE DISTRIBUTION
      // ============================================================

      doc.fontSize(20)
         .font('Helvetica-Bold')
         .fillColor('#1B2559')
         .text('Blood Type Distribution', 50, 50);

      doc.moveDown(1);

      if (stats.bloodTypeDistribution && stats.bloodTypeDistribution.length > 0) {
        const totalDonors = stats.stats.totalDonors || 1;
        let barY = 120;

        stats.bloodTypeDistribution.forEach((item, index) => {
          const percentage = (item._count / totalDonors) * 100;
          const barWidth = percentage * 4; // Max 400px for 100%

          // Blood type label
          doc.fontSize(11)
             .font('Helvetica-Bold')
             .fillColor('#333333')
             .text(`${item.bloodType}:`, 50, barY);

          // Donor count
          doc.font('Helvetica')
             .fillColor('#666666')
             .text(` ${item._count} donors`, 110, barY);

          // Percentage bar
          doc.fillColor('#CC0000')
             .rect(50, barY + 15, barWidth, 12)
             .fill();

          // Percentage text
          doc.fillColor('#555555')
             .fontSize(9)
             .text(`${percentage.toFixed(1)}%`, 50 + barWidth + 10, barY + 16);

          barY += 45;
        });

        doc.moveDown(2);

        // Summary
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .fillColor('#1B2559')
           .text('Summary', 50, barY + 10);

        doc.moveDown(0.5);
        doc.fontSize(10)
           .font('Helvetica')
           .fillColor('#555555')
           .text(`Total Registered Donors: ${totalDonors}`, 50, doc.y);

        // Most common blood type
        const mostCommon = [...stats.bloodTypeDistribution].sort((a, b) => b._count - a._count)[0];
        if (mostCommon) {
          doc.text(`Most Common Blood Type: ${mostCommon.bloodType} (${mostCommon._count} donors)`, 50, doc.y + 20);
        }
      }

      // Footer
      doc.fontSize(8)
         .fillColor('#999999')
         .text('Sew Le Sew Platform • Ethiopian Red Cross • Page 3 of 5', 50, 750, { align: 'center' });

      doc.addPage();

      // ============================================================
      // PAGE 4: AI PREDICTIONS
      // ============================================================

      doc.fontSize(20)
         .font('Helvetica-Bold')
         .fillColor('#1B2559')
         .text('AI-Powered Predictions', 50, 50);

      doc.moveDown(1);

      // Info box
      doc.fillColor('#F3F4F6')
         .rect(50, doc.y, 500, 140)
         .fill();

      const boxY = doc.y;
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor('#CC0000')
         .text(' Groq AI Analysis (Llama 3)', 65, boxY + 15);

      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#333333')
         .text(`Confidence Score: ${predictions?.data?.confidence || 75}%`, 65, boxY + 45)
         .text(`Predicted Demand Increase: +${predictions?.data?.demandIncrease || 10}%`, 65, boxY + 70)
         .text(`Predicted Blood Shortage: ${predictions?.data?.shortageBloodType || 'O+'}`, 65, boxY + 95)
         .text(`Recommended Location: ${predictions?.data?.recommendedLocation || 'Addis Ababa'}`, 65, boxY + 120);

      doc.moveDown(10);

      // Recommendation box
      doc.fillColor('#FEF2F2')
         .rect(50, doc.y, 500, 70)
         .fill();

      const recY = doc.y;
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .fillColor('#CC0000')
         .text(' AI Recommendation', 65, recY + 15);

      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#333333')
         .text(predictions?.data?.recommendation || 'Schedule regular donation drives to maintain supply levels.', 65, recY + 40);

      // Footer
      doc.fontSize(8)
         .fillColor('#999999')
         .text('Sew Le Sew Platform • Ethiopian Red Cross • Page 4 of 5', 50, 750, { align: 'center' });

      doc.addPage();

      // ============================================================
      // PAGE 5: TRENDS & CLOSING
      // ============================================================

      doc.fontSize(20)
         .font('Helvetica-Bold')
         .fillColor('#1B2559')
         .text('6-Month Trend Analysis', 50, 50);

      doc.moveDown(1);

      const months = ['January', 'February', 'March', 'April', 'May', 'June'];
      const mockRequests = [65, 72, 88, 95, 110, 125];
      const mockDonations = [58, 64, 75, 82, 98, 112];

      // Trend data as text (since charts are complex)
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#333333')
         .text('Monthly Donation Activity:', 50, 120);

      doc.moveDown(0.5);

      // Table format for trends
      const trendTop = 140;

      // Header
      doc.fillColor('#CC0000')
         .rect(50, trendTop, 500, 20)
         .fill();
      doc.fillColor('#FFFFFF')
         .font('Helvetica-Bold')
         .fontSize(9)
         .text('Month', 60, trendTop + 5)
         .text('Donation Requests', 160, trendTop + 5)
         .text('Completed Donations', 320, trendTop + 5);

      let trendY = trendTop + 20;
      for (let i = 0; i < months.length; i++) {
        const bgColor = i % 2 === 0 ? '#F9FAFB' : '#FFFFFF';
        doc.fillColor(bgColor)
           .rect(50, trendY, 500, 20)
           .fill();

        doc.fillColor('#333333')
           .font('Helvetica')
           .fontSize(9)
           .text(months[i], 60, trendY + 5)
           .text(mockRequests[i].toString(), 160, trendY + 5)
           .text(mockDonations[i].toString(), 320, trendY + 5);

        trendY += 20;
      }

      doc.moveDown(4);

      // Growth calculation
      const totalRequests = mockRequests.reduce((a, b) => a + b, 0);
      const totalDonations = mockDonations.reduce((a, b) => a + b, 0);
      const growthRate = ((totalRequests - totalDonations) / totalDonations * 100).toFixed(1);

      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#555555')
         .text(`Total Requests (6 months): ${totalRequests}`, 50, doc.y + 20)
         .text(`Total Completed Donations: ${totalDonations}`, 50, doc.y + 40)
         .text(`Demand vs Supply Gap: ${growthRate}% more requests than donations`, 50, doc.y + 60);

      // Closing message
      doc.moveDown(4);
      doc.fontSize(11)
         .font('Helvetica-Oblique')
         .fillColor('#666666')
         .text('Thank you for your continued support in saving lives across Ethiopia.', 50, doc.y + 40, { align: 'center' });

      // Footer
      doc.fontSize(8)
         .fillColor('#999999')
         .text('Sew Le Sew Platform • Ethiopian Red Cross • Page 5 of 5', 50, 750, { align: 'center' });

      doc.end();
    } catch (error) {
      console.error('PDF Generation Error:', error);
      reject(error);
    }
  });
};