import {
  Button, Badge, Box, Text, Col, Paper, ScrollArea, Table, Select,
} from '@mantine/core';
import { Link } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  appStore, beetStore, identitiesStore, localePreferenceStore,
} from '../lib/states';

export default function Mode(properties) {
  const { t, i18n } = useTranslation();

  const setMode = appStore((state) => state.setMode);
  const environment = appStore((state) => state.environment);
  const identities = identitiesStore((state) => state.identities);
  const removeIdentity = identitiesStore((state) => state.removeIdentity);
  const reset = beetStore((state) => state.reset);
  const changeLocale = localePreferenceStore((state) => state.changeLocale);

  /**
   * Set the i18n locale
   * @param {String} newLocale
   */
  function setLanguage(newLocale) {
    try {
      i18n.changeLanguage(newLocale);
    } catch (error) {
      console.log(error);
      return;
    }

    try {
      changeLocale(newLocale);
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * Removing a previously linked identity from the identity store
   * @param {Object} rowIdentity
   */
  function remove(rowIdentity) {
    try {
      removeIdentity(rowIdentity.requested.account.id);
    } catch (error) {
      console.log(error);
    }
  }

  const relevantChain = environment === 'bitshares' ? 'BTS' : 'BTS_TEST';
  const relevantIdentities = identities.filter((x) => x.chain === relevantChain);

  const rows = relevantIdentities
    .map((row) => (
      <tr key={`${row.requested.account.name}_row`}>
        <td>
          <Badge color="dark" sx={{ marginTop: '5px', marginRight: '5px' }}>
            {row.requested.account.name}
            {' '}
            (
            {row.requested.account.id}
            )
          </Badge>
          <Button
            sx={{ marginTop: '5px' }}
            variant="subtle"
            color="red"
            compact
            onClick={() => {
              remove(row);
            }}
          >
            {t('setup:settings.remove')}
          </Button>
        </td>
      </tr>
    ))
    .filter((x) => x);

  function back() {
    setMode();
    reset();
  }

  return (
    <Paper padding="sm" shadow="xs">
      <Text size="md">
        {t('setup:settings.settings')}
      </Text>

      <Paper padding="sm" shadow="xs">
        {identities && identities.length ? (
          <Box mx="auto" sx={{ padding: '10px', paddingTop: '10px' }}>
            <Text size="md">
              {t('setup:settings.linked')}
            </Text>
            <ScrollArea
              sx={{ height: rows.length > 1 && rows.length < 3 ? rows.length * 55 : 120 }}
            >
              <Table sx={{ minWidth: 700 }}>
                <tbody>{rows}</tbody>
              </Table>
            </ScrollArea>
          </Box>
        ) : (
          <Box mx="auto" sx={{ padding: '10px', paddingTop: '10px' }}>
            <Text size="md">
              {t('setup:settings.notLinked')}
            </Text>
          </Box>
        )}
        <br />
        <Select
          label={t('setup:settings.language')}
          placeholder="Pick one"
          onChange={(value) => {
            setLanguage(value);
          }}
          sx={{ paddingLeft: '25%', paddingRight: '25%' }}
          data={[
            { value: 'en', label: 'English' },
            { value: 'da', label: 'Dansk' },
            { value: 'de', label: 'Deutsche' },
            { value: 'et', label: 'Eesti' },
            { value: 'es', label: 'Español' },
            { value: 'fr', label: 'Français' },
            { value: 'it', label: 'Italiano' },
            { value: 'ja', label: '日本語' },
            { value: 'ko', label: '한국어' },
            { value: 'pt', label: 'Português' },
            { value: 'th', label: 'ไทย' },
          ]}
        />
        <br />
        <Link style={{ textDecoration: 'none' }} to="/">
          <Button
            sx={{ marginBottom: '15px' }}
            variant="subtle"
            color="red"
            compact
            onClick={() => {
              back();
            }}
          >
            {t('setup:settings.back')}
          </Button>
        </Link>
      </Paper>
    </Paper>
  );
}
