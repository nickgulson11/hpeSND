# HPE Quote Discount Management POC

A proof-of-concept web application for managing discounts on HPE hardware maintenance service quotes.

## Features

- View all available quotes with customer and product information
- Select a quote to modify discounts
- Edit discounts for both products and maintenance services
- Real-time calculation of line item and quote totals
- Built with React, Grommet, and HPE Design System

## Installation

```bash
npm install
```

## Running the Application

```bash
npm start
```

The application will open in your browser at `http://localhost:3000`

## Usage

1. **Quote List Page**: View all available quotes in a table format
2. **Click "Edit Discounts"**: Navigate to the discount editor for a specific quote
3. **Modify Discounts**: Click edit buttons next to products or services to adjust discount percentages
4. **Save Quote**: Save your changes when finished

## Sample Data

The application includes 3 sample quotes with various HPE products:
- Servers (ProLiant, Apollo, Synergy, etc.)
- Storage (Nimble, Alletra, Primera)
- Networking equipment

Each product includes 1-2 maintenance services such as:
- High Touch Maintenance
- Service Credits
- Proactive Care Advanced
- Datacenter Care
- Foundation Care
- Tech Care Essential

## Technology Stack

- React 18
- Grommet UI Framework
- HPE Design System Theme
- React Router for navigation
