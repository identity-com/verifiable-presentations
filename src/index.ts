import { VerifiablePresentationManager } from './VerifiablePresentationManager';
export const Greeter = (name: string) => `Hello ${name}`;

/**
 * Most secure manager verify data in a redundant way
 */
export const secureRedundantManager = new VerifiablePresentationManager({});
/**
 * Good secure manager that favor the ingestion performance by skipping the verify only on that process
 */
export const secureFastIngestManager = new VerifiablePresentationManager({skipAddVerify: true});
/**
 * Good secure manager that favor the read performance by skipping the verify only on that process
 */
export const secureFastReadManager = new VerifiablePresentationManager({skipGetVerify: true});
/**
 * Mock manager that should only be used in test or development
 */
export const insecureManager = new VerifiablePresentationManager({
    skipGetVerify: true,
    skipAddVerify: true,
    allowListUnverified: true,
    allowGetUnverified: true,
    allowMocks:true
});

