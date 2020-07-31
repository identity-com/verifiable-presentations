import { VerifiablePresentationManager, VPMOptions } from './VerifiablePresentationManager';
import { VerifyFunction } from './PresentationVerifier';

export class VerifiablePresentationManagerFactory {

  /**
   * Most secure manager verify data in a redundant way
   */
  static createCustomManager(options: VPMOptions, verifyAnchor?: VerifyFunction) {
    return new VerifiablePresentationManager(options, verifyAnchor);
  }

  /**
   * Most secure manager verify data in a redundant way
   */
  static createSecureRedundantManager() {
    return new VerifiablePresentationManager({});
  }

  /**
   * Good secure manager that favor the ingestion performance by skipping the verify only on that process
   */
  static createSecureFastIngestManager() {
    return new VerifiablePresentationManager({
      skipAddVerify: true
    });
  }

  /**
   * Good secure manager that favor the read performance by skipping the verify only on that process
   */
  static createSecureFastReadManager() {
    return new VerifiablePresentationManager({
      skipGetVerify: true,
      allowGetUnverified: true
    });
  }

  /**
   * Mock manager that should only be used in test or development
   */
  static createInsecureManager() {
    return new VerifiablePresentationManager({
      skipAddVerify: true,
      skipGetVerify: true,
      allowGetUnverified: true,
      notThrow: true
    });
  }
}
