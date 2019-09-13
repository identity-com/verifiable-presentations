import { Credential } from '../Credential';
import { PresentationVerifier } from '../PresentationVerifier';
import emailCredential from './fixtures/emailCredential.json';

describe('PresentationVerifier', () => {
    it('should initialize a PresentationVerifier', () => {
        const verifier = new PresentationVerifier();
        expect(verifier).toBeDefined();
    });

    it('should verify the proofs of a valid credential', () => {
        const verifier = new PresentationVerifier();
        const verified = verifier.nonCryptographicallySecureVerify(emailCredential as Credential);
        expect(verified).toBeTruthy();
    });
});
