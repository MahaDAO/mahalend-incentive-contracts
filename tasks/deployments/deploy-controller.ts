import { task } from 'hardhat/config';

import { eContractid, eEthereumNetwork } from '../../helpers/types';
import { registerContractInJsonDb } from '../../helpers/contracts-helpers';
import { getAaveAdminPerNetwork, getAaveTokenPerNetwork } from '../../helpers/constants';
import {
  deployInitializableAdminUpgradeabilityProxy,
  deployAaveIncentivesController,
} from '../../helpers/contracts-accessors';
import { checkVerification } from '../../helpers/etherscan-verification';

const { AaveIncentivesController } = eContractid;

task(`deploy-xAaveIncentivesController`, `Deploys the AaveIncentivesController contract`)
  .addFlag('verify', 'Verify AaveIncentivesController contract via Etherscan API.')
  .addOptionalParam(
    'admin',
    `The address to be added as an Admin role in ${AaveIncentivesController} Transparent Proxy.`
  )
  .addOptionalParam('aaveAddress', 'Use AaveToken address by param instead of configuration.')
  .setAction(async ({ verify, aaveAddress, aaveAdmin }, localBRE) => {
    await localBRE.run('set-dre');
    console.log('running');

    // If Etherscan verification is enabled, check needed enviroments to prevent loss of gas in failed deployments.
    if (verify) {
      checkVerification();
    }

    if (!localBRE.network.config.chainId) {
      throw new Error('INVALID_CHAIN_ID');
    }

    const [deployer] = await localBRE.ethers.getSigners();
    const emissionManager = await deployer.getAddress();

    const network = localBRE.network.name as eEthereumNetwork;

    console.log(deployer.address);
    console.log(`\n- ${AaveIncentivesController} deployment`);

    console.log(`\tDeploying ${AaveIncentivesController} implementation ...`);
    const controllerImpl = await deployAaveIncentivesController(
      [aaveAddress || getAaveTokenPerNetwork(network), emissionManager, (365 * 86400).toString()],
      verify
    );
    await controllerImpl.deployTransaction.wait();
    await registerContractInJsonDb(AaveIncentivesController, controllerImpl);

    console.log(`\tDeploying ${AaveIncentivesController} Transparent Proxy ...`);
    const stakedAaveProxy = await deployInitializableAdminUpgradeabilityProxy(verify);
    await registerContractInJsonDb(AaveIncentivesController, stakedAaveProxy);

    console.log(controllerImpl.address, aaveAdmin || getAaveAdminPerNetwork(network), '');

    await stakedAaveProxy.functions['initialize(address,address,bytes)'](
      controllerImpl.address,
      aaveAdmin || getAaveAdminPerNetwork(network),
      '0x'
    );

    console.log(`\tFinished ${AaveIncentivesController} proxy and implementation deployment`);
  });
