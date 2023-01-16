import React, { useEffect, useState } from 'react';
import {
  Button, Box, Text, Col, Paper,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { appStore } from '../../lib/states';

export default function Offline(properties) {
  const { t, i18n } = useTranslation();
  const setMode = appStore((state) => state.setMode);

  return (
    <Col span={12}>
      <Paper padding="sm" shadow="xs">
        <Box mx="auto" sx={{ padding: '10px' }}>
          <span>
            <Text size="md">
              {t('setup:offline.header')}
            </Text>
            <Button
              sx={{ marginTop: '15px', marginRight: '5px', marginLeft: '5px' }}
              onClick={() => {
                setMode();
              }}
            >
              {t('setup:offline.exit')}
            </Button>
          </span>
        </Box>
      </Paper>
    </Col>
  );
}
