import _ from 'lodash';
import { Credential } from '../Credential';
import { PresentationVerifier, VerifyFunction } from '../PresentationVerifier';
import emailCredential from './fixtures/emailCredential.json';

describe('PresentationVerifier', () => {
    it('should initialize a PresentationVerifier', () => {
        const verifier = new PresentationVerifier();
        expect(verifier).toBeDefined();
    });

    describe('Non cryptographically secure verify', () => {
        const verifier = new PresentationVerifier();

        it('should return true if the credential is valid', () => {
            const verified = verifier.nonCryptographicallySecureVerify(emailCredential as Credential);
            expect(verified).toBeTruthy();
        });

        it('should be able to verify a credential twice', () => {
            let verified = verifier.nonCryptographicallySecureVerify(emailCredential as Credential);
            expect(verified).toBeTruthy();

            verified = verifier.nonCryptographicallySecureVerify(emailCredential as Credential);
            expect(verified).toBeTruthy();
        });

        it('should return false if the credential claim does not match the leaves', () => {
            const invalidEmailCredential = _.cloneDeep(emailCredential);
            invalidEmailCredential.claim.contact.email.username = 'invalid';

            const verified = verifier.nonCryptographicallySecureVerify(invalidEmailCredential as Credential);
            expect(verified).toBeFalsy();
        });

        it('should return false if a leave target hash does not match', () => {
            const invalidEmailCredential = _.cloneDeep(emailCredential);
            invalidEmailCredential.proof.leaves[0].targetHash += 'a';

            const verified = verifier.nonCryptographicallySecureVerify(invalidEmailCredential as Credential);
            expect(verified).toBeFalsy();
        });

        it('should return false if a leave has an invalid value', () => {
            const invalidEmailCredential = _.cloneDeep(emailCredential);
            invalidEmailCredential.proof.leaves[0].value += 'a';

            const verified = verifier.nonCryptographicallySecureVerify(invalidEmailCredential as Credential);
            expect(verified).toBeFalsy();
        });
    });

    describe('Cryptographically secure verify', () => {
        it('should return true if the credential is valid and the verify functions are not provided', async (done) => {
            const verifier = new PresentationVerifier();
            const verified = await verifier.cryptographicallySecureVerify(emailCredential as Credential);
            expect(verified).toBeTruthy();
            done();
        });

        it('should return true if all validation passes', async (done) => {
            const myVerifyAnchor : VerifyFunction = (proof) => true;
            const myVerifySignature : VerifyFunction = (proof) => true;
            const verifier = new PresentationVerifier(myVerifyAnchor, myVerifySignature);
            const verified = await verifier.cryptographicallySecureVerify(emailCredential as Credential);
            expect(verified).toBeTruthy();
            done();
        });

        it('should return false if anchor validation fails', async (done) => {
            const myVerifyAnchor : VerifyFunction = (proof) => false;
            const myVerifySignature : VerifyFunction = (proof) => true;
            const verifier = new PresentationVerifier(myVerifyAnchor, myVerifySignature);
            const verified = await verifier.cryptographicallySecureVerify(emailCredential as Credential);
            expect(verified).toBeFalsy();
            done();
        });

        it('should return false if signature validation fails', async (done) => {
            const myVerifyAnchor : VerifyFunction = (proof) => true;
            const myVerifySignature : VerifyFunction = (proof) => false;
            const verifier = new PresentationVerifier(myVerifyAnchor, myVerifySignature);
            const verified = await verifier.cryptographicallySecureVerify(emailCredential as Credential);
            expect(verified).toBeFalsy();
            done();
        });
    });
});
