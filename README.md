<div align="center">
  <h1>PayPal Invoice Discord Manager</h1>
  <p>A highly professional and secure Discord bot designed to manage, generate, and track PayPal invoices seamlessly within Discord. Built specifically for freelancers and digital agencies.</p>
</div>

## Features
- Slash Commands: Fully supports modern Discord commands using CommandKit.
- Visual Invoices: Automatically generates a beautiful receipt/invoice image using canvas with your own custom background (inv.png).
- PayPal API Integration: Directly creates draft invoices inside your PayPal Business account.
- Secure & Private: Advanced middleware authorization to ensure only specific Discord IDs can generate invoices.
- Local Database: Tracks all generated invoices locally so you can list them and check their payment status anytime.

## Prerequisites
- Node.js (v16.9.0 or newer)
- A Discord Bot Token
- A PayPal Developer App (Client ID & Secret)

## Installation & Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/AmrMHattab/Discord-Invoice-PayPal-Manager.git
   cd Discord-Invoice-PayPal-Manager
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Rename the .env.example file to .env and fill in your credentials:
   ```env
   # Discord Bot Configuration
   APP_BOT_TOKEN=your_bot_token_here
   APP_IDENTIFIER=your_client_id_here
   MAIN_SERVER_ID=your_guild_id_here

   # PayPal Configuration
   PAYMENT_GATEWAY_PUBLIC=your_paypal_client_id_here
   PAYMENT_GATEWAY_SECRET=your_paypal_client_secret_here
   PAYMENT_API_ENDPOINT=https://api-m.sandbox.paypal.com # Change to https://api-m.paypal.com for live
   PAYMENT_ENV=sandbox # Change to live for production
   INVOICE_BRANDING_NAME="Hattab"

   # Bot Authorization
   ADMINISTRATOR_IDS=your_discord_id_here # Separate multiple IDs with commas
   ```

4. Customize Backgrounds:
   Place your custom invoice background images inside the Images/ folder:
   - inv.png (Used for generating the invoice preview)
   - payment.png (Used for payment success state)

5. Start the Bot:
   ```bash
   npm start
   ```
   *The bot will automatically register its slash commands to Discord on startup.*

## Usage / Commands
- /create [amount] [user] [service] -- Creates a new PayPal invoice and generates a visual receipt image in the chat.
- /status [invoice_id] -- Checks if an invoice has been paid or is still pending.
- /invoices [filter] -- Lists all local invoices (Filter by: All, Pending, Paid, Cancelled).

## Project Structure
```text
paypal-invoice
 |- Images               (Put your custom backgrounds here)
 |- src
 |  |- commands          (Slash commands logic)
 |  |- events            (Discord event listeners)
 |  |- middlewares       (Permissions and authorization checks)
 |  |- modules           (Core services: PayPal API, Canvas Renderer, Database)
 |  |- index.js          (Main bot entry point)
 |- .env                 (Secret keys)
 |- package.json
 |- README.md
```

## License & Credits
Developed by Hattab. All rights reserved.
