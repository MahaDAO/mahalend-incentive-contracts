import { task } from 'hardhat/config';
import { eContractid, eEthereumNetwork, tEthereumAddress } from '../../helpers/types';
import { registerContractInJsonDb } from '../../helpers/contracts-helpers';
import {
  getAaveTokenPerNetwork,
  getCooldownSecondsPerNetwork,
  getUnstakeWindowPerNetwork,
  getAaveAdminPerNetwork,
  getDistributionDurationPerNetwork,
  getAaveIncentivesVaultPerNetwork,
  ZERO_ADDRESS,
} from '../../helpers/constants';
import {
  deployStakedAave,
  deployInitializableAdminUpgradeabilityProxy,
  deployAaveIncentivesController,
} from '../../helpers/contracts-accessors';
import { checkVerification } from '../../helpers/etherscan-verification';
import { ethers } from 'hardhat';

const { StakedAave, StakedAaveImpl, AaveIncentivesController } = eContractid;

const network = 'goerli';
task(
  `deploy-${AaveIncentivesController}`,
  `Deploys the ${AaveIncentivesController} contract`
).setAction(async ({}, localBRE) => {
  await localBRE.run('set-dre');

  // // If Etherscan verification is enabled, check needed enviroments to prevent loss of gas in failed deployments.
  // if (verify) {
  //   checkVerification();
  // }

  if (!localBRE.network.config.chainId) {
    throw new Error('INVALID_CHAIN_ID');
  }

  console.log(`\n- ${AaveIncentivesController} deployment`);

  console.log(`\tDeploying ${AaveIncentivesController} implementation ...`);
  const incentiveController = await deployAaveIncentivesController(
    ['0xedd6ca8a4202d4a36611e2fff109648c4863ae19', '0xbA1af27c0eFdfBE8B0FE1E8F890f9E896D1B2d6f'],
    false
  );

  await incentiveController.deployTransaction.wait();
  console.log('Address', incentiveController.address);
  await registerContractInJsonDb('IncentiveController', incentiveController);

  console.log('Initializing reward vault');
  await incentiveController.initialize('0xbA1af27c0eFdfBE8B0FE1E8F890f9E896D1B2d6f');
});
