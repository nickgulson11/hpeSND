import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  Button,
  Grid,
  Page,
  PageContent,
  PageHeader,
  DataTable
} from 'grommet';
import { Edit, Document } from 'grommet-icons';
import quotesData from '../data/quotes.json';

const QuoteList = () => {
  const navigate = useNavigate();

  const handleEditQuote = (quoteId) => {
    navigate(`/quote/${quoteId}`);
  };

  const columns = [
    {
      property: 'id',
      header: <Text weight="bold">Quote ID</Text>,
      primary: true,
    },
    {
      property: 'customer',
      header: <Text weight="bold">Customer</Text>,
    },
    {
      property: 'createdDate',
      header: <Text weight="bold">Created Date</Text>,
    },
    {
      property: 'totalValue',
      header: <Text weight="bold">Total Value</Text>,
      render: datum => `$${datum.totalValue.toLocaleString()}`,
    },
    {
      property: 'status',
      header: <Text weight="bold">Status</Text>,
    },
    {
      property: 'lineItems',
      header: <Text weight="bold">Products</Text>,
      render: datum => datum.lineItems.length,
    },
    {
      property: 'action',
      header: <Text weight="bold">Action</Text>,
      render: datum => (
        <Button
          icon={<Edit />}
          label="Edit Discounts"
          onClick={() => handleEditQuote(datum.id)}
          primary
          size="small"
        />
      ),
    },
  ];

  return (
    <Page background="background-back">
      <PageContent>
        <PageHeader
          title="HPE Quote Management"
          subtitle="Select a quote to modify discounts"
          pad={{ horizontal: 'medium', vertical: 'small' }}
        />
        <Box pad="medium">
          <Card background="white">
            <CardHeader pad="medium">
              <Box direction="row" gap="small" align="center">
                <Document color="brand" />
                <Heading level={3} margin="none">
                  Available Quotes
                </Heading>
              </Box>
            </CardHeader>
            <CardBody pad="medium">
              <DataTable
                columns={columns}
                data={quotesData}
                step={10}
                paginate
              />
            </CardBody>
          </Card>
        </Box>
      </PageContent>
    </Page>
  );
};

export default QuoteList;
