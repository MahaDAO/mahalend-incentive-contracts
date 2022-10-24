import { task } from 'hardhat/config';
import { eContractid } from '../../helpers/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { AaveIncentivesController } from '../../types/AaveIncentivesController';

task('dev-deployment', 'Deployment in hardhat').setAction(async (_, localBRE) => {
  const DRE: HardhatRuntimeEnvironment = await localBRE.run('set-dre');

  (await DRE.run(`deploy-${eContractid.AaveIncentivesController}`)) as AaveIncentivesController;
});
