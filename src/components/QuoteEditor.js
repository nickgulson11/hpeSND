import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  Button,
  TextInput,
  Page,
  PageContent,
  PageHeader,
  Table,
  TableHeader,
  TableRow,
  TableCell,
  TableBody,
} from 'grommet';
import { FormPreviousLink, Save, FormDown, FormNext } from 'grommet-icons';
import quotesData from '../data/quotes.json';

const QuoteEditor = () => {
  const { quoteId } = useParams();
  const navigate = useNavigate();
  const quote = quotesData.find(q => q.id === quoteId);

  const [lineItems, setLineItems] = useState(quote?.lineItems || []);
  const [modifiedItems, setModifiedItems] = useState(new Set());
  const [globalDiscount, setGlobalDiscount] = useState('');
  const [targetTotal, setTargetTotal] = useState('');
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [quoteExpanded, setQuoteExpanded] = useState(true);

  if (!quote) {
    return (
      <Page>
        <PageContent>
          <Box pad="large" align="center">
            <Heading level={2}>Quote not found</Heading>
            <Button label="Back to Quotes" onClick={() => navigate('/')} />
          </Box>
        </PageContent>
      </Page>
    );
  }

  // Calculate unit price for a product (sum of all service prices)
  const calculateProductUnitPrice = (item) => {
    return item.services.reduce((sum, svc) => sum + svc.price, 0);
  };

  // Get effective discount for a service (product discount overrides service discount)
  const getEffectiveServiceDiscount = (productDiscount, serviceDiscount) => {
    // Product discount overrides service discount if it exists
    return productDiscount > 0 ? productDiscount : serviceDiscount;
  };

  const handleProductDiscountChange = (itemId, newValue) => {
    const newDiscount = parseFloat(newValue) || 0;

    // Update product discount and clear all service discounts
    const updatedItems = lineItems.map(item =>
      item.id === itemId
        ? {
            ...item,
            discount: newDiscount,
            services: item.services.map(svc => ({ ...svc, discount: 0 }))
          }
        : item
    );

    setLineItems(updatedItems);

    // Mark product and all its services as modified
    const newModifiedItems = new Set(modifiedItems);
    newModifiedItems.add(itemId);
    const item = updatedItems.find(i => i.id === itemId);
    item.services.forEach(svc => newModifiedItems.add(svc.id));
    setModifiedItems(newModifiedItems);
  };

  const handleServiceDiscountChange = (lineItemId, serviceId, newValue) => {
    const newDiscount = parseFloat(newValue) || 0;

    // Update service discount and clear product discount
    const updatedItems = lineItems.map(item =>
      item.id === lineItemId
        ? {
            ...item,
            discount: 0,
            services: item.services.map(svc =>
              svc.id === serviceId
                ? { ...svc, discount: newDiscount }
                : svc
            )
          }
        : item
    );

    setLineItems(updatedItems);

    // Mark product and service as modified
    const newModifiedItems = new Set(modifiedItems);
    newModifiedItems.add(lineItemId);
    newModifiedItems.add(serviceId);
    setModifiedItems(newModifiedItems);
  };

  const handleApplyGlobalDiscount = () => {
    const discount = parseFloat(globalDiscount) || 0;

    // Apply discount to all line items (which applies to all services)
    const updatedItems = lineItems.map(item => ({
      ...item,
      discount: discount,
      services: item.services.map(svc => ({ ...svc, discount: 0 }))
    }));

    setLineItems(updatedItems);

    // Mark all items as modified
    const newModifiedItems = new Set();
    updatedItems.forEach(item => newModifiedItems.add(item.id));
    setModifiedItems(newModifiedItems);

    setGlobalDiscount('');
  };

  const handleApplyTargetTotal = () => {
    const target = parseFloat(targetTotal) || 0;
    const subtotal = calculateQuoteSubtotal();

    if (subtotal === 0 || target >= subtotal) {
      alert('Target total must be less than the current subtotal');
      return;
    }

    // Calculate required discount percentage
    const requiredDiscount = ((subtotal - target) / subtotal) * 100;

    // Apply discount to all line items
    const updatedItems = lineItems.map(item => ({
      ...item,
      discount: requiredDiscount,
      services: item.services.map(svc => ({ ...svc, discount: 0 }))
    }));

    setLineItems(updatedItems);

    // Mark all items as modified
    const newModifiedItems = new Set();
    updatedItems.forEach(item => newModifiedItems.add(item.id));
    setModifiedItems(newModifiedItems);

    setTargetTotal('');
  };

  const calculateLineTotal = (item) => {
    const unitPrice = calculateProductUnitPrice(item);
    const subtotal = unitPrice * item.quantity;

    // Calculate total discount amount across all services
    const totalDiscount = item.services.reduce((sum, svc) => {
      const effectiveDiscount = getEffectiveServiceDiscount(item.discount, svc.discount);
      return sum + (svc.price * item.quantity * effectiveDiscount / 100);
    }, 0);

    return subtotal - totalDiscount;
  };

  const calculateQuoteTotal = () => {
    return lineItems.reduce((sum, item) => sum + calculateLineTotal(item), 0);
  };

  const calculateQuoteSubtotal = () => {
    return lineItems.reduce((sum, item) => {
      const unitPrice = calculateProductUnitPrice(item);
      return sum + (unitPrice * item.quantity);
    }, 0);
  };

  const calculateQuoteTotalDiscount = () => {
    return calculateQuoteSubtotal() - calculateQuoteTotal();
  };

  const calculateQuoteDiscountPercent = () => {
    const subtotal = calculateQuoteSubtotal();
    const discount = calculateQuoteTotalDiscount();
    return subtotal > 0 ? (discount / subtotal) * 100 : 0;
  };

  const formatCurrency = (amount) => {
    return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const toggleQuoteExpansion = () => {
    setQuoteExpanded(!quoteExpanded);
  };

  const toggleItemExpansion = (itemId) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const handleExpandCollapseAll = () => {
    // If everything is expanded, collapse all
    if (quoteExpanded && expandedItems.size === lineItems.length) {
      setQuoteExpanded(false);
      setExpandedItems(new Set());
    } else {
      // Otherwise, expand all
      setQuoteExpanded(true);
      setExpandedItems(new Set(lineItems.map(item => item.id)));
    }
  };

  const handleQuoteLevelDiscountChange = (newValue) => {
    const discount = parseFloat(newValue) || 0;

    // Apply discount to all line items (which applies to all services)
    const updatedItems = lineItems.map(item => ({
      ...item,
      discount: discount,
      services: item.services.map(svc => ({ ...svc, discount: 0 }))
    }));

    setLineItems(updatedItems);

    // Mark all items as modified
    const newModifiedItems = new Set();
    updatedItems.forEach(item => newModifiedItems.add(item.id));
    setModifiedItems(newModifiedItems);
  };

  return (
    <Page background="background-back">
      <PageContent>
        <PageHeader
          title={`Quote ${quote.id}`}
          subtitle={`Customer: ${quote.customer}`}
          parent={
            <Button
              icon={<FormPreviousLink />}
              label="Back to Quotes"
              onClick={() => navigate('/')}
            />
          }
          pad={{ horizontal: 'medium', vertical: 'small' }}
        />

        <Box pad="small" gap="small">
          <Card background="white" elevation="small">
            <CardBody pad="medium">
              <Box direction="row" justify="between" align="center" gap="medium">
                {/* Left: Metadata */}
                <Box direction="row" gap="medium" align="center" border={{ side: 'right', color: 'light-3' }} pad={{ right: 'medium' }}>
                  <Box direction="row" gap="xsmall" align="baseline">
                    <Text size="small" weight="bold">Date:</Text>
                    <Text size="small">{quote.createdDate}</Text>
                  </Box>
                  <Box direction="row" gap="xsmall" align="baseline">
                    <Text size="small" weight="bold">Status:</Text>
                    <Text size="small">{quote.status}</Text>
                  </Box>
                  <Box direction="row" gap="xsmall" align="baseline">
                    <Text size="small" weight="bold">Items:</Text>
                    <Text size="small">{lineItems.length}</Text>
                  </Box>
                </Box>

                {/* Center: Financials */}
                <Box direction="row" gap="large" align="center" flex>
                  <Box align="end">
                    <Text size="xsmall" color="text-weak" margin={{ bottom: 'xxsmall' }}>Subtotal</Text>
                    <Text size="small" weight="bold">{formatCurrency(calculateQuoteSubtotal())}</Text>
                  </Box>
                  <Box align="end">
                    <Text size="xsmall" color="text-weak" margin={{ bottom: 'xxsmall' }}>Discount %</Text>
                    <Text size="small" weight="bold" color="status-ok">{calculateQuoteDiscountPercent().toFixed(2)}%</Text>
                  </Box>
                  <Box align="end">
                    <Text size="xsmall" color="text-weak" margin={{ bottom: 'xxsmall' }}>Discount Amount</Text>
                    <Text size="small" weight="bold" color="status-ok">-{formatCurrency(calculateQuoteTotalDiscount())}</Text>
                  </Box>
                  <Box align="end" pad={{ left: 'small' }} border={{ side: 'left', color: 'light-3' }}>
                    <Text size="xsmall" color="text-weak" margin={{ bottom: 'xxsmall' }}>Quote Total</Text>
                    <Text size="medium" weight="bold" color="brand">{formatCurrency(calculateQuoteTotal())}</Text>
                  </Box>
                </Box>

                {/* Right: Quick Actions */}
                <Box direction="row" gap="small" align="center" border={{ side: 'left', color: 'light-3' }} pad={{ left: 'medium' }}>
                  <Box>
                    <Text size="xsmall" weight="bold" margin={{ bottom: 'xxsmall' }}>Apply Discount %</Text>
                    <Box direction="row" gap="xsmall">
                      <TextInput
                        type="number"
                        step="1"
                        min="0"
                        max="100"
                        placeholder="Enter %"
                        value={globalDiscount}
                        onChange={(e) => setGlobalDiscount(e.target.value)}
                        size="small"
                        style={{ width: '90px' }}
                      />
                      <Button
                        label="Apply"
                        onClick={handleApplyGlobalDiscount}
                        size="small"
                        primary
                      />
                    </Box>
                  </Box>
                  <Box>
                    <Text size="xsmall" weight="bold" margin={{ bottom: 'xxsmall' }}>Set Target Total</Text>
                    <Box direction="row" gap="xsmall">
                      <TextInput
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Enter amount"
                        value={targetTotal}
                        onChange={(e) => setTargetTotal(e.target.value)}
                        size="small"
                        style={{ width: '110px' }}
                      />
                      <Button
                        label="Apply"
                        onClick={handleApplyTargetTotal}
                        size="small"
                        primary
                      />
                    </Box>
                  </Box>
                </Box>
              </Box>
            </CardBody>
          </Card>

          <Card background="white" elevation="small">
            <CardBody pad="medium">
              <Box direction="row" justify="between" align="center" margin={{ bottom: 'small' }}>
                <Text weight="bold" size="small">Quote Line Items</Text>
                <Button
                  label={quoteExpanded && expandedItems.size === lineItems.length ? "Collapse All" : "Expand All"}
                  onClick={handleExpandCollapseAll}
                  size="small"
                  secondary
                />
              </Box>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell scope="col" border="bottom" pad="small" width="30px">
                      <Text weight="bold" size="small"></Text>
                    </TableCell>
                    <TableCell scope="col" border="bottom" pad="small">
                      <Text weight="bold" size="small">Item</Text>
                    </TableCell>
                    <TableCell scope="col" border="bottom" pad="small">
                      <Text weight="bold" size="small">Qty</Text>
                    </TableCell>
                    <TableCell scope="col" border="bottom" pad="small">
                      <Text weight="bold" size="small">Unit Price</Text>
                    </TableCell>
                    <TableCell scope="col" border="bottom" pad="small">
                      <Text weight="bold" size="small">Subtotal</Text>
                    </TableCell>
                    <TableCell scope="col" border="bottom" pad="small">
                      <Text weight="bold" size="small">Discount %</Text>
                    </TableCell>
                    <TableCell scope="col" border="bottom" pad="small">
                      <Text weight="bold" size="small">Discount Amt</Text>
                    </TableCell>
                    <TableCell scope="col" border="bottom" pad="small">
                      <Text weight="bold" size="small">Total</Text>
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Quote Level Row */}
                  <TableRow background="light-4">
                    <TableCell pad="small" onClick={toggleQuoteExpansion} style={{ cursor: 'pointer' }}>
                      {quoteExpanded ? <FormDown size="small" /> : <FormNext size="small" />}
                    </TableCell>
                    <TableCell pad="small" onClick={toggleQuoteExpansion} style={{ cursor: 'pointer' }}>
                      <Text weight="bold" size="small">Quote Total</Text>
                    </TableCell>
                    <TableCell pad="small" onClick={toggleQuoteExpansion} style={{ cursor: 'pointer' }}>
                      <Text size="small">{lineItems.reduce((sum, item) => sum + item.quantity, 0)}</Text>
                    </TableCell>
                    <TableCell pad="small" onClick={toggleQuoteExpansion} style={{ cursor: 'pointer' }}>
                      <Text size="small">-</Text>
                    </TableCell>
                    <TableCell pad="small" onClick={toggleQuoteExpansion} style={{ cursor: 'pointer' }}>
                      <Text weight="bold" size="small">{formatCurrency(calculateQuoteSubtotal())}</Text>
                    </TableCell>
                    <TableCell pad="small" onClick={(e) => e.stopPropagation()}>
                      <Box
                        width="90px"
                        direction="row"
                        align="center"
                        background="light-1"
                        pad={{ horizontal: 'xsmall', vertical: '2px' }}
                        round="xxsmall"
                        border={{ color: 'light-4', size: 'xsmall' }}
                      >
                        <TextInput
                          plain
                          type="number"
                          step="1"
                          min="0"
                          max="100"
                          value={calculateQuoteDiscountPercent().toFixed(2)}
                          onChange={(e) => handleQuoteLevelDiscountChange(e.target.value)}
                          style={{
                            color: calculateQuoteDiscountPercent() > 0 ? '#00C781' : 'inherit',
                            fontWeight: 'bold',
                            textAlign: 'right',
                            border: 'none',
                            background: 'transparent',
                            padding: '2px 4px'
                          }}
                        />
                        <Text
                          size="small"
                          color={calculateQuoteDiscountPercent() > 0 ? 'status-ok' : 'text'}
                          weight="bold"
                        >
                          %
                        </Text>
                      </Box>
                    </TableCell>
                    <TableCell pad="small" onClick={toggleQuoteExpansion} style={{ cursor: 'pointer' }}>
                      <Text weight="bold" size="small" color="status-ok">-{formatCurrency(calculateQuoteTotalDiscount())}</Text>
                    </TableCell>
                    <TableCell pad="small" onClick={toggleQuoteExpansion} style={{ cursor: 'pointer' }}>
                      <Text weight="bold" size="small" color="brand">{formatCurrency(calculateQuoteTotal())}</Text>
                    </TableCell>
                  </TableRow>

                  {quoteExpanded && lineItems.map((item) => {
                    const unitPrice = calculateProductUnitPrice(item);
                    const subtotal = unitPrice * item.quantity;
                    const lineTotal = calculateLineTotal(item);
                    const lineDiscountAmount = subtotal - lineTotal;
                    const productDiscountPercent = subtotal > 0 ? (lineDiscountAmount / subtotal) * 100 : 0;
                    const isItemExpanded = expandedItems.has(item.id);

                    return (
                      <React.Fragment key={item.id}>
                        <TableRow background="light-2" onClick={() => toggleItemExpansion(item.id)} style={{ cursor: 'pointer' }}>
                          <TableCell pad="small">
                            {isItemExpanded ? <FormDown size="small" /> : <FormNext size="small" />}
                          </TableCell>
                          <TableCell pad="small">
                            <Text weight="bold" size="small">{item.product}</Text>
                          </TableCell>
                          <TableCell pad="small"><Text size="small">{item.quantity}</Text></TableCell>
                          <TableCell pad="small"><Text size="small">{formatCurrency(unitPrice)}</Text></TableCell>
                          <TableCell pad="small"><Text size="small">{formatCurrency(subtotal)}</Text></TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Box
                              width="90px"
                              direction="row"
                              align="center"
                              background="light-1"
                              pad={{ horizontal: 'xsmall', vertical: '2px' }}
                              round="xxsmall"
                              border={{ color: 'light-4', size: 'xsmall' }}
                            >
                              <TextInput
                                plain
                                type="number"
                                step="1"
                                min="0"
                                max="100"
                                value={productDiscountPercent.toFixed(2)}
                                onChange={(e) => handleProductDiscountChange(item.id, e.target.value)}
                                style={{
                                  color: modifiedItems.has(item.id) ? '#FF8C00' : (productDiscountPercent > 0 ? '#00C781' : 'inherit'),
                                  fontWeight: modifiedItems.has(item.id) || productDiscountPercent > 0 ? 'bold' : 'normal',
                                  textAlign: 'right',
                                  border: 'none',
                                  background: 'transparent',
                                  padding: '2px 4px'
                                }}
                              />
                              <Text
                                size="small"
                                weight={modifiedItems.has(item.id) || productDiscountPercent > 0 ? 'bold' : 'normal'}
                                color={modifiedItems.has(item.id) ? 'status-warning' : (productDiscountPercent > 0 ? 'status-ok' : 'text')}
                              >
                                %
                              </Text>
                            </Box>
                          </TableCell>
                          <TableCell pad="small">
                            <Text size="small" weight={modifiedItems.has(item.id) || lineDiscountAmount > 0 ? 'bold' : 'normal'} color={modifiedItems.has(item.id) ? 'status-warning' : (lineDiscountAmount > 0 ? 'status-ok' : 'text')}>
                              -{formatCurrency(lineDiscountAmount)}
                            </Text>
                          </TableCell>
                          <TableCell pad="small">
                            <Text weight="bold" size="small">{formatCurrency(lineTotal)}</Text>
                          </TableCell>
                        </TableRow>
                        {isItemExpanded && item.services.map(service => {
                          const effectiveDiscount = getEffectiveServiceDiscount(item.discount, service.discount);
                          const serviceSubtotal = service.price * item.quantity;
                          const serviceDiscountAmount = serviceSubtotal * effectiveDiscount / 100;
                          const serviceTotal = serviceSubtotal - serviceDiscountAmount;

                          return (
                            <TableRow key={service.id}>
                              <TableCell pad="small">
                                {/* Empty cell for alignment */}
                              </TableCell>
                              <TableCell pad="small">
                                <Box pad={{ left: 'medium' }}>
                                  <Text size="small">↳ {service.name} <Text size="xsmall" color="text-weak">({service.duration})</Text></Text>
                                </Box>
                              </TableCell>
                              <TableCell pad="small"><Text size="small">{item.quantity}</Text></TableCell>
                              <TableCell pad="small"><Text size="small">{formatCurrency(service.price)}</Text></TableCell>
                              <TableCell pad="small"><Text size="small">{formatCurrency(serviceSubtotal)}</Text></TableCell>
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                <Box
                                  width="90px"
                                  direction="row"
                                  align="center"
                                  background="light-1"
                                  pad={{ horizontal: 'xsmall', vertical: '2px' }}
                                  round="xxsmall"
                                  border={{ color: 'light-4', size: 'xsmall' }}
                                >
                                  <TextInput
                                    plain
                                    type="number"
                                    step="1"
                                    min="0"
                                    max="100"
                                    value={effectiveDiscount.toFixed(2)}
                                    onChange={(e) => handleServiceDiscountChange(item.id, service.id, e.target.value)}
                                    style={{
                                      color: modifiedItems.has(service.id) || modifiedItems.has(item.id) ? '#FF8C00' : (effectiveDiscount > 0 ? '#00C781' : 'inherit'),
                                      fontWeight: modifiedItems.has(service.id) || modifiedItems.has(item.id) || effectiveDiscount > 0 ? 'bold' : 'normal',
                                      textAlign: 'right',
                                      border: 'none',
                                      background: 'transparent',
                                      padding: '2px 4px'
                                    }}
                                  />
                                  <Text
                                    size="small"
                                    weight={modifiedItems.has(service.id) || modifiedItems.has(item.id) || effectiveDiscount > 0 ? 'bold' : 'normal'}
                                    color={modifiedItems.has(service.id) || modifiedItems.has(item.id) ? 'status-warning' : (effectiveDiscount > 0 ? 'status-ok' : 'text')}
                                  >
                                    %
                                  </Text>
                                </Box>
                              </TableCell>
                              <TableCell pad="small">
                                <Text size="small" weight={modifiedItems.has(service.id) || modifiedItems.has(item.id) || serviceDiscountAmount > 0 ? 'bold' : 'normal'} color={modifiedItems.has(service.id) || modifiedItems.has(item.id) ? 'status-warning' : (serviceDiscountAmount > 0 ? 'status-ok' : 'text')}>
                                  -{formatCurrency(serviceDiscountAmount)}
                                </Text>
                              </TableCell>
                              <TableCell pad="small"><Text size="small">{formatCurrency(serviceTotal)}</Text></TableCell>
                            </TableRow>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </CardBody>
          </Card>

          <Box direction="row" justify="end" gap="small">
            <Button
              label="Cancel"
              onClick={() => navigate('/')}
              secondary
            />
            <Button
              icon={<Save />}
              label="Save Quote"
              primary
              onClick={() => {
                alert('Quote saved successfully!');
                navigate('/');
              }}
            />
          </Box>
        </Box>
      </PageContent>

    </Page>
  );
};

export default QuoteEditor;
