/* eslint-disable max-len */
import React, { useEffect, useState } from 'react';
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';

import {
  Title,
  Text,
  SimpleGrid,
  Card,
  ThemeIcon,
} from '@mantine/core';

import {
  HiOutlineDocumentAdd,
  HiOutlineUserAdd,
  HiOutlineScissors,
  HiOutlineIdentification,
  HiOutlinePlus,
  HiOutlineWifi,
  HiOutlineQuestionMarkCircle,
} from "react-icons/hi";

import { tempStore, beetStore, appStore } from '../lib/states';

export default function Home(properties) {
  const { t, i18n } = useTranslation();

  const resetTemp = tempStore((state) => state.reset);
  const resetBeet = beetStore((state) => state.reset);
  const setEnvironment = appStore((state) => state.setEnvironment);

  useEffect(() => {
    resetTemp();
    resetBeet();
    setEnvironment();
  }, []);

  return (
    <>
      <Title order={2} ta="center" mt="sm">
        {t("home:title")}
      </Title>

      <Text c="dimmed" ta="center" mt="md">
        {t("home:desc")}
      </Text>

      <SimpleGrid cols={3} spacing="xl" mt={50} breakpoints={[{ maxWidth: 'md', cols: 2 }, { maxWidth: 'sm', cols: 1 }]}>
        <Link style={{ textDecoration: 'none' }} to="/createNFT/create">
          <Card shadow="md" radius="md" padding="xl">
            <ThemeIcon variant="light" size={40} radius={40}>
              <HiOutlinePlus />
            </ThemeIcon>
            <Text fz="lg" fw={500} mt="sm">
              {t("home:grid.createNFT.title")}
            </Text>
            <Text fz="sm" c="dimmed" mt="sm">
              {t("home:grid.createNFT.desc")}
            </Text>
          </Card>
        </Link>
        <Link style={{ textDecoration: 'none' }} to="/editNFT">
          <Card shadow="md" radius="md" padding="xl">
            <ThemeIcon variant="light" size={40} radius={40}>
              <HiOutlineScissors />
            </ThemeIcon>
            <Text fz="lg" fw={500} mt="sm">
              {t("home:grid.editNFT.title")}
            </Text>
            <Text fz="sm" c="dimmed" mt="sm">
              {t("home:grid.editNFT.desc")}
            </Text>
          </Card>
        </Link>
        <Link style={{ textDecoration: 'none' }} to="/load">
          <Card shadow="md" radius="md" padding="xl">
            <ThemeIcon variant="light" size={40} radius={40}>
              <HiOutlineDocumentAdd />
            </ThemeIcon>
            <Text fz="lg" fw={500} mt="sm">
              {t("home:grid.load.title")}
            </Text>
            <Text fz="sm" c="dimmed" mt="sm">
              {t("home:grid.load.desc")}
            </Text>
          </Card>
        </Link>
        <Link style={{ textDecoration: 'none' }} to="/issueNFT">
          <Card shadow="md" radius="md" padding="xl">
            <ThemeIcon variant="light" size={40} radius={40}>
              <HiOutlineUserAdd />
            </ThemeIcon>
            <Text fz="lg" fw={500} mt="sm">
              {t("home:grid.issueNFT.title")}
            </Text>
            <Text fz="sm" c="dimmed" mt="sm">
              {t("home:grid.issueNFT.desc")}
            </Text>
          </Card>
        </Link>
        <Link style={{ textDecoration: 'none' }} to="/upgrade">
          <Card shadow="md" radius="md" padding="xl">
            <ThemeIcon variant="light" size={40} radius={40}>
              <HiOutlineIdentification />
            </ThemeIcon>
            <Text fz="lg" fw={500} mt="sm">
              {t("home:grid.upgrade.title")}
            </Text>
            <Text fz="sm" c="dimmed" mt="sm">
              {t("home:grid.upgrade.desc")}
            </Text>
          </Card>
        </Link>
        <Link style={{ textDecoration: 'none' }} to="/faq">
          <Card shadow="md" radius="md" padding="xl">
            <ThemeIcon variant="light" size={40} radius={40}>
              <HiOutlineQuestionMarkCircle />
            </ThemeIcon>
            <Text fz="lg" fw={500} mt="sm">
              {t("home:grid.faq.title")}
            </Text>
            <Text fz="sm" c="dimmed" mt="sm">
              {t("home:grid.faq.desc")}
            </Text>
          </Card>
        </Link>
        <Link style={{ textDecoration: 'none' }} to="/nodes">
          <Card shadow="md" radius="md" padding="xl">
            <ThemeIcon variant="light" size={40} radius={40}>
              <HiOutlineWifi />
            </ThemeIcon>
            <Text fz="lg" fw={500} mt="sm">
              {t("home:grid.nodes.title")}
            </Text>
            <Text fz="sm" c="dimmed" mt="sm">
              {t("home:grid.nodes.desc")}
            </Text>
          </Card>
        </Link>
      </SimpleGrid>

      <Text c="dimmed" ta="center" mt="md">
        {t("home:footer")}
      </Text>
    </>
  );
}
