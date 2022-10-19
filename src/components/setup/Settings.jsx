import { Button, Badge, Box, Text, Col, Paper, ScrollArea, Table } from '@mantine/core';
import { appStore, beetStore, identitiesStore } from '../../lib/states';

export default function Mode(properties) {
  const setMode = appStore((state) => state.setMode); 
  const environment = appStore((state) => state.environment); 
  const identities = identitiesStore((state) => state.identities);
  const removeIdentity = identitiesStore((state) => state.removeIdentity);
  const reset = beetStore((state) => state.reset);

  /**
   * Removing a previously linked identity from the identity store
   * @param {Object} rowIdentity 
   */
   function remove(rowIdentity) {
    try {
      removeIdentity(rowIdentity.requested.account.id)
    } catch (error) {
      console.log(error)
    }
  }

  const relevantChain = environment === 'production' ? 'BTS' : 'BTS_TEST';
  let relevantIdentities = identities.filter(x => x.chain === relevantChain);

  const rows = relevantIdentities.map((row) => {
    return (<tr key={row.requested.account.name + "_row"}>
              <td>
                <Badge color="dark" sx={{marginTop: '5px', marginRight: '5px'}}>
                  {row.requested.account.name} ({row.requested.account.id})
                </Badge>
                <Button
                  sx={{marginTop: '5px'}}
                  variant="subtle" color="red" compact
                  onClick={() => {
                    remove(row)
                  }}
                >
                  Remove
                </Button>
              </td>
            </tr>)
  }).filter(x => x);

  function back() {
    setMode();
    reset();
  }

  return (
    <Col span={12}>
      <Paper padding="sm" shadow="xs">
            <Text size="md">
              Settings
            </Text>

            <Paper padding="sm" shadow="xs">
                {
                  identities && identities.length
                    ? <Box mx="auto" sx={{padding: '10px', paddingTop: '10px'}}>
                        <Text size="md">
                          Here are your currently linked acounts
                        </Text>
                        <ScrollArea sx={{ height: rows.length > 1 && rows.length < 3 ? rows.length * 55 : 120 }}>
                          <Table sx={{ minWidth: 700 }}>
                            <tbody>
                              {rows}
                            </tbody>
                          </Table>
                        </ScrollArea>
                      </Box>
                    : <Box mx="auto" sx={{padding: '10px', paddingTop: '10px'}}>
                        <Text size="md">
                          Beet not linked.
                        </Text>
                      </Box>                     
                }
                <Button
                  sx={{marginBottom: '15px'}}
                  variant="subtle" color="red" compact
                  onClick={() => {
                    back()
                  }}
                >
                  Back
                </Button>
            </Paper>
      </Paper>
    </Col>
  );
}
