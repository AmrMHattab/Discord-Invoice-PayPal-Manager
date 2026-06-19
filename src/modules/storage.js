const fs = require('fs');
const path = require('path');

class DatabaseService {
    constructor() {
        this.dbPath = path.join(__dirname, '../data/invoices.json');
        this.ensureDataDirectory();
        this.invoices = this.loadInvoices();
    }

    ensureDataDirectory() {
        const dataDir = path.dirname(this.dbPath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        if (!fs.existsSync(this.dbPath)) {
            fs.writeFileSync(this.dbPath, JSON.stringify([], null, 2));
        }
    }

    loadInvoices() {
        try {
            const data = fs.readFileSync(this.dbPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error loading invoices:', error);
            return [];
        }
    }

    saveToFile() {
        try {
            fs.writeFileSync(this.dbPath, JSON.stringify(this.invoices, null, 2));
        } catch (error) {
            console.error('Error saving invoices:', error);
        }
    }

    saveInvoice(invoiceData) {
        const invoice = {
            ...invoiceData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.invoices.push(invoice);
        this.saveToFile();
        return invoice;
    }

    updateInvoiceStatus(invoiceId, status) {
        const index = this.invoices.findIndex(inv => inv.invoiceId === invoiceId);
        if (index !== -1) {
            this.invoices[index].status = status;
            this.invoices[index].updatedAt = new Date().toISOString();
            this.saveToFile();
            return this.invoices[index];
        }
        return null;
    }

    getInvoiceById(invoiceId) {
        return this.invoices.find(inv => inv.invoiceId === invoiceId);
    }

    getPendingInvoices() {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        return this.invoices.filter(inv => {
            if (inv.status === 'CANCELLED' || inv.status === 'PAID') {
                return false;
            }
            
            const invoiceDate = new Date(inv.createdAt);
            if (invoiceDate < sevenDaysAgo) {
                return false;
            }
            
            return inv.status === 'pending' || 
                   inv.status === 'DRAFT' || 
                   inv.status === 'SENT' ||
                   inv.status === 'SCHEDULED';
        });
    }

    getInvoicesByUser(userId) {
        return this.invoices.filter(inv => inv.userId === userId);
    }

    getAllInvoices() {
        return this.invoices;
    }

    deleteInvoice(invoiceId) {
        const index = this.invoices.findIndex(inv => inv.invoiceId === invoiceId);
        if (index !== -1) {
            const deleted = this.invoices.splice(index, 1)[0];
            this.saveToFile();
            return deleted;
        }
        return null;
    }

    getInvoice(invoiceId) {
        return this.getInvoiceById(invoiceId);
    }

    getInvoices(filter = 'all') {
        if (filter === 'all') {
            return this.getAllInvoices();
        } else if (filter === 'pending') {
            return this.getPendingInvoices();
        } else if (filter === 'paid') {
            return this.invoices.filter(inv => inv.status === 'PAID');
        } else if (filter === 'cancelled') {
            return this.invoices.filter(inv => 
                inv.status === 'CANCELLED' || 
                inv.status === 'EXPIRED'
            );
        }
        return [];
    }

    getInvoiceStats() {
        const total = this.invoices.length;
        const paid = this.invoices.filter(inv => inv.status === 'PAID').length;
        const pending = this.invoices.filter(inv => 
            inv.status === 'pending' || 
            inv.status === 'DRAFT' || 
            inv.status === 'SENT'
        ).length;
        const failed = this.invoices.filter(inv => 
            inv.status === 'CANCELLED' || 
            inv.status === 'EXPIRED'
        ).length;

        const totalAmount = this.invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
        const paidAmount = this.invoices
            .filter(inv => inv.status === 'PAID')
            .reduce((sum, inv) => sum + (inv.amount || 0), 0);

        return {
            total,
            paid,
            pending,
            failed,
            totalAmount,
            paidAmount
        };
    }
}

module.exports = { DatabaseService };