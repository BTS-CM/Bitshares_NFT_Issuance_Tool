import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Container, Title, Accordion, Text } from '@mantine/core';

export default function FAQ(properties) {
  const { t, i18n } = useTranslation();
  const faqContent = [
    'create',
    'edit',
    'draft',
    'issue',
    'airdrop',
    'beet',
    'blockchains',
  ];

  const contents = faqContent.map((x) => ({
    key: x,
    control: t(`faq:${x}.control`),
    panel: t(`faq:${x}.panel`),
  }));

  return (
    <Container size="sm">
      <Title order={2} ta="center" mt="sm" style={{ marginBottom: '20px' }}>
        {t("faq:title")}
      </Title>

      <Accordion variant="separated">
        {
          contents.map((item) => (
            <Accordion.Item key={`acc_${item.key}`} value={item.key}>
              <Accordion.Control>{item.control}</Accordion.Control>
              <Accordion.Panel>
                <Text size="sm" align="left">
                  {item.panel}
                </Text>
              </Accordion.Panel>
            </Accordion.Item>
          ))
        }
      </Accordion>
    </Container>
  );
}
