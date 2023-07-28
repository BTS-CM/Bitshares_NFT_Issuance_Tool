import React from 'react';
import { Link } from "react-router-dom";
import {
  Button, Box, Text, Col, Paper,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';

export default function Offline(properties) {
  const { t, i18n } = useTranslation();

  return (
    <Col span={12}>
      <Paper padding="sm" shadow="xs">
        <Box mx="auto" sx={{ padding: '10px' }}>
          <span>
            <Text size="md">
              {t('setup:offline.header')}
            </Text>
            <Link style={{ textDecoration: 'none' }} to="/">
              <Button
                sx={{ marginTop: '15px', marginRight: '5px', marginLeft: '5px' }}
              >
                {t('setup:offline.exit')}
              </Button>
            </Link>
          </span>
        </Box>
      </Paper>
    </Col>
  );
}
