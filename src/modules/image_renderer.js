const { createCanvas, loadImage } = require('@napi-rs/canvas');
const path = require('path');

class CanvasService {
    constructor() {
        // Image paths
        this.invoiceBackgroundPath = path.join(__dirname, '../../Images/inv.png');
        this.paymentBackgroundPath = path.join(__dirname, '../../Images/payment.png');

        // EASY POSITIONING CONFIGURATION
        // Modify these X,Y coordinates to position text elements
        this.invoicePositions = {
            username: { x: 140, y: 310 },      // Username
            nickname: { x: 140, y: 330 },      // Nickname (beside username)
            date: { x: 140, y: 350 },          // Invoice date
            amount: { x: 140, y: 390 },        // Base amount
            tax: { x: 140, y: 425 },           // Tax/fee amount
            totalAmount: { x: 140, y: 475 },   // Total amount
            orderId: { x: 430, y: 170 },       // Order/Invoice ID
            service: { x: 140, y: 610 }        // Service/order description
        };

        this.paymentPositions = {
            username: { x: 140, y: 310 },
            nickname: { x: 140, y: 330 },
            date: { x: 140, y: 350 },
            amount: { x: 140, y: 390 },
            tax: { x: 140, y: 425 },
            totalAmount: { x: 140, y: 475 },
            orderId: { x: 430, y: 170 },
            service: { x: 140, y: 610 }
        };

        // Text styling
        this.textStyle = {
            color: '#FFFFFF',
            font: '24px Poppins',
            smallFont: '18px Poppins',
            align: 'left'
        };
    }

    async createInvoiceCanvas(totalAmount, service, user, invoiceData = null) {
        try {
            const backgroundImage = await loadImage(this.invoiceBackgroundPath);
            const canvas = createCanvas(backgroundImage.width, backgroundImage.height);
            const ctx = canvas.getContext('2d');
            
            ctx.drawImage(backgroundImage, 0, 0);
            
            ctx.fillStyle = this.textStyle.color;
            ctx.font = this.textStyle.font;
            ctx.textAlign = this.textStyle.align;
            
            const nickname = user.globalName || user.username;
            const userDisplay = `${user.username} (${nickname})`;
            
            // Draw all text elements using coordinates from invoicePositions
            ctx.fillText(userDisplay, this.invoicePositions.username.x, this.invoicePositions.username.y);
            
            const invoiceDate = new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
            ctx.fillText(invoiceDate, this.invoicePositions.date.x, this.invoicePositions.date.y);
            
            const baseAmount = invoiceData?.baseAmount || (totalAmount / 1.0495);
            ctx.fillText(`$${baseAmount.toFixed(2)}`, this.invoicePositions.amount.x, this.invoicePositions.amount.y);
            
            const taxAmount = invoiceData?.feeAmount || (totalAmount - baseAmount);
            ctx.fillText(`$${taxAmount.toFixed(2)}`, this.invoicePositions.tax.x, this.invoicePositions.tax.y);
            
            ctx.fillText(`$${totalAmount.toFixed(2)}`, this.invoicePositions.totalAmount.x, this.invoicePositions.totalAmount.y);
            
            ctx.font = this.textStyle.smallFont;
            const orderId = invoiceData?.id || 'N/A';
            ctx.fillText(orderId, this.invoicePositions.orderId.x, this.invoicePositions.orderId.y);
            
            ctx.font = this.textStyle.font;
            ctx.fillText(service, this.invoicePositions.service.x, this.invoicePositions.service.y);
            
            return canvas.toBuffer('image/png');
        } catch (error) {
            console.error('Error creating invoice canvas:', error);
            throw error;
        }
    }

    async createSuccessCanvas(amount, service, user, invoiceData = null) {
        try {
            const backgroundImage = await loadImage(this.paymentBackgroundPath);
            const canvas = createCanvas(backgroundImage.width, backgroundImage.height);
            const ctx = canvas.getContext('2d');
            
            ctx.drawImage(backgroundImage, 0, 0);
            
            ctx.fillStyle = this.textStyle.color;
            ctx.font = this.textStyle.font;
            ctx.textAlign = this.textStyle.align;
            
            const nickname = user.globalName || user.username;
            const userDisplay = `${user.username} (${nickname})`;
            
            // Draw all text elements using coordinates from paymentPositions
            ctx.fillText(userDisplay, this.paymentPositions.username.x, this.paymentPositions.username.y);
            
            const paymentDate = new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
            ctx.fillText(paymentDate, this.paymentPositions.date.x, this.paymentPositions.date.y);
            
            const baseAmount = invoiceData?.baseAmount || (amount / 1.0495);
            ctx.fillText(`$${baseAmount.toFixed(2)}`, this.paymentPositions.amount.x, this.paymentPositions.amount.y);
            
            const taxAmount = invoiceData?.feeAmount || (amount - baseAmount);
            ctx.fillText(`$${taxAmount.toFixed(2)}`, this.paymentPositions.tax.x, this.paymentPositions.tax.y);
            
            ctx.fillText(`$${amount.toFixed(2)}`, this.paymentPositions.totalAmount.x, this.paymentPositions.totalAmount.y);
            
            ctx.font = this.textStyle.smallFont;
            const orderId = (typeof invoiceData === 'string' ? invoiceData : invoiceData?.id) || 'N/A';
            ctx.fillText(orderId, this.paymentPositions.orderId.x, this.paymentPositions.orderId.y);
            
            ctx.font = this.textStyle.font;
            ctx.fillText(service, this.paymentPositions.service.x, this.paymentPositions.service.y);
            
            return canvas.toBuffer('image/png');
        } catch (error) {
            console.error('Error creating success canvas:', error);
            throw error;
        }
    }

    async createFailedCanvas(amount, service, user) {
        // Fallback for failed transactions if needed in the future
        return await this.createSuccessCanvas(amount, service, user);
    }
}

module.exports = { CanvasService };