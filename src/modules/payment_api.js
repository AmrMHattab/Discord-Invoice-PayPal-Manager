const axios = require('axios');

class PayPalService {
    constructor() {
        this.baseURL = process.env.PAYMENT_API_ENDPOINT || 'https://api-m.sandbox.paypal.com';
        this.clientId = process.env.PAYMENT_GATEWAY_PUBLIC;
        this.clientSecret = process.env.PAYMENT_GATEWAY_SECRET;
        this.accessToken = null;
        this.tokenExpiry = null;
    }

    async getAccessToken() {
        if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
            return this.accessToken;
        }

        try {
            const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
            
            const response = await axios.post(`${this.baseURL}/v1/oauth2/token`, 
                'grant_type=client_credentials', 
                {
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );

            this.accessToken = response.data.access_token;
            this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);
            
            return this.accessToken;
        } catch (error) {
            console.error('Error getting PayPal access token:', error);
            throw error;
        }
    }

    async createInvoice({ amount, currency = 'USD', description, recipientEmail }) {
        try {
            const token = await this.getAccessToken();
            
            const invoiceData = {
                detail: {
                    invoice_number: `INV-${Date.now()}`,
                    invoice_date: new Date().toISOString().split('T')[0],
                    currency_code: currency,
                    note: description,
                    payment_term: {
                        term_type: 'NET_10'
                    }
                },
                invoicer: {
                    name: {
                        given_name: process.env.INVOICE_BRANDING_NAME || 'Hattab',
                        surname: ''
                    },
                    business_name: process.env.INVOICE_BRANDING_NAME || 'Hattab'
                },
                primary_recipients: [
                    {
                        billing_info: {
                            email_address: recipientEmail
                        }
                    }
                ],
                items: [
                    {
                        name: description,
                        description: description,
                        quantity: '1',
                        unit_amount: {
                            currency_code: currency,
                            value: amount.toFixed(2)
                        }
                    }
                ],
                configuration: {
                    partial_payment: {
                        allow_partial_payment: false
                    },
                    allow_tip: false
                }
            };

            const response = await axios.post(`${this.baseURL}/v2/invoicing/invoices`, invoiceData, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('PayPal Invoice Creation Response:', JSON.stringify(response.data, null, 2));
            
            let invoiceId = response.data.id;
            
            if (!invoiceId && response.data.href) {
                const hrefMatch = response.data.href.match(/\/invoices\/([^\/]+)$/);
                if (hrefMatch) {
                    invoiceId = hrefMatch[1];
                    console.log('Extracted invoice ID from href:', invoiceId);
                }
            }
            
            if (!invoiceId) {
                console.error('No invoice ID in response:', response.data);
                throw new Error('PayPal did not return an invoice ID');
            }
            
            let invoiceDetails = null;
            try {
                const detailsResponse = await axios.get(`${this.baseURL}/v2/invoicing/invoices/${invoiceId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                invoiceDetails = detailsResponse.data;
                console.log('Invoice details retrieved successfully');
                console.log('Invoice details:', JSON.stringify(invoiceDetails, null, 2));
            } catch (detailsError) {
                console.warn('Failed to get invoice details:', detailsError.message);
            }

            let invoiceSent = false;
            try {
                const sendResponse = await axios.post(`${this.baseURL}/v2/invoicing/invoices/${invoiceId}/send`, {
                    send_to_invoicer: false,
                    send_to_recipient: true,
                    additional_recipients: []
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
                console.log('Invoice sent successfully:', sendResponse.status);
                invoiceSent = true;
            } catch (sendError) {
                console.warn('Invoice sending failed, but invoice was created. Error:', sendError.message);
                if (sendError.response && sendError.response.status !== 404) {
                    console.error('Send error details:', JSON.stringify(sendError.response.data, null, 2));
                }
            }

            const isProduction = this.baseURL.includes('api-m.paypal.com');
            let paymentLink;
            
            if (isProduction) {
                paymentLink = `https://www.paypal.com/invoice/s/pay/${invoiceId}`;
            } else {
                paymentLink = `https://www.sandbox.paypal.com/invoice/s/pay/${invoiceId}`;
            }
            
            if (invoiceDetails?.detail?.metadata?.recipient_view_url) {
                paymentLink = invoiceDetails.detail.metadata.recipient_view_url;
                console.log('Found recipient payment URL:', paymentLink);
            } else if (invoiceDetails && invoiceDetails.links) {
                const payLink = invoiceDetails.links.find(link => 
                    link.rel === 'payer-view' || 
                    link.rel === 'pay' || 
                    link.href.includes('/pay/') ||
                    link.href.includes('/invoice/p/')
                );
                if (payLink) {
                    paymentLink = payLink.href;
                    console.log('Found payment link in invoice details:', paymentLink);
                }
            }

            return {
                id: invoiceId,
                href: response.data.href || `${this.baseURL}/v2/invoicing/invoices/${invoiceId}`,
                status: 'SENT',
                paymentLink: paymentLink
            };

        } catch (error) {
            console.error('Error creating PayPal invoice:', error);
            if (error.response && error.response.data) {
                console.error('PayPal API Error Details:', JSON.stringify(error.response.data, null, 2));
            }
            throw error;
        }
    }

    async createSimpleInvoice({ amount, currency = 'USD', description, recipientEmail }) {
        try {
            const token = await this.getAccessToken();
            
            const invoiceData = {
                detail: {
                    invoice_number: `INV-${Date.now()}`,
                    invoice_date: new Date().toISOString().split('T')[0],
                    currency_code: currency,
                    note: description
                },
                invoicer: {
                    name: {
                        given_name: process.env.INVOICE_BRANDING_NAME || 'Hattab',
                        surname: ''
                    },
                    business_name: process.env.INVOICE_BRANDING_NAME || 'Hattab'
                },
                primary_recipients: [
                    {
                        billing_info: {
                            email_address: recipientEmail
                        }
                    }
                ],
                items: [
                    {
                        name: description,
                        description: description,
                        quantity: '1',
                        unit_amount: {
                            currency_code: currency,
                            value: amount.toFixed(2)
                        }
                    }
                ]
            };

            const response = await axios.post(`${this.baseURL}/v2/invoicing/invoices`, invoiceData, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('Simple Invoice Creation Response:', JSON.stringify(response.data, null, 2));
            
            let invoiceId = response.data.id;
            
            if (!invoiceId && response.data.href) {
                const hrefMatch = response.data.href.match(/\/invoices\/([^\/]+)$/);
                if (hrefMatch) {
                    invoiceId = hrefMatch[1];
                }
            }
            
            if (!invoiceId) {
                throw new Error('PayPal did not return an invoice ID');
            }
            const isProduction = this.baseURL.includes('api-m.paypal.com');
            let paymentLink;
            
            if (isProduction) {
                paymentLink = `https://www.paypal.com/invoice/s/pay/${invoiceId}`;
            } else {
                paymentLink = `https://www.sandbox.paypal.com/invoice/s/pay/${invoiceId}`;
            }
            
            try {
                const detailsResponse = await axios.get(`${this.baseURL}/v2/invoicing/invoices/${invoiceId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (detailsResponse.data?.detail?.metadata?.recipient_view_url) {
                    paymentLink = detailsResponse.data.detail.metadata.recipient_view_url;
                    console.log('Found recipient payment URL:', paymentLink);
                }
            } catch (detailsError) {
                console.warn('Failed to get invoice details for payment URL:', detailsError.message);
            }

            return {
                id: invoiceId,
                href: response.data.href || `https://api.paypal.com/v2/invoicing/invoices/${invoiceId}`,
                status: response.data.status || 'DRAFT',
                paymentLink: paymentLink
            };

        } catch (error) {
            console.error('Error creating simple PayPal invoice:', error);
            if (error.response && error.response.data) {
                console.error('PayPal API Error Details:', JSON.stringify(error.response.data, null, 2));
            }
            throw error;
        }
    }

    async getInvoiceStatus(invoiceId) {
        try {
            const token = await this.getAccessToken();
            
            const response = await axios.get(`${this.baseURL}/v2/invoicing/invoices/${invoiceId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            return response.data.status;
        } catch (error) {
            if (error.response && error.response.status === 403) {
                return 'SENT';
            }
            if (error.response && error.response.status === 404) {
                return 'CANCELLED';
            }
            console.error('Error getting invoice status:', error.message);
            throw error;
        }
    }

    async cancelInvoice(invoiceId) {
        try {
            const token = await this.getAccessToken();
            
            await axios.post(`${this.baseURL}/v2/invoicing/invoices/${invoiceId}/cancel`, {
                subject: 'Invoice cancelled',
                note: 'Invoice has been cancelled',
                send_to_invoicer: true,
                send_to_recipient: true
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            return true;
        } catch (error) {
            console.error('Error cancelling invoice:', error);
            throw error;
        }
    }
}

module.exports = { PayPalService };