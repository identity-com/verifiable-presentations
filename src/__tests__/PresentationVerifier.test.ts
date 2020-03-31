import { Credential } from '../Credential';
import * as R from 'ramda';
import { PresentationVerifier, VerifyFunction } from '../PresentationVerifier';
import emailCredential from './fixtures/emailCredential.json';
import idDocumentCredential from './fixtures/idDocumentCredential.json';
import idDocumentDSR from './fixtures/idDocumentDSR.json';

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
            const invalidEmailCredential = R.clone(emailCredential);
            invalidEmailCredential.claim.contact.email.username = 'invalid';

            const verified = verifier.nonCryptographicallySecureVerify(invalidEmailCredential as Credential);
            expect(verified).toBeFalsy();
        });

        it('should return false if a leave target hash does not match', () => {
            const invalidEmailCredential = R.clone(emailCredential);
            invalidEmailCredential.proof.leaves[0].targetHash += 'a';

            const verified = verifier.nonCryptographicallySecureVerify(invalidEmailCredential as Credential);
            expect(verified).toBeFalsy();
        });

        it('should return false if a leave has an invalid value', () => {
            const invalidEmailCredential = R.clone(emailCredential);
            invalidEmailCredential.proof.leaves[0].value += 'a';

            const verified = verifier.nonCryptographicallySecureVerify(invalidEmailCredential as Credential);
            expect(verified).toBeFalsy();
        });
    });

    describe('Cryptographically secure verify', () => {
        it('should return true if the credential is valid and the verify functions are not provided', async () => {
            const verifier = new PresentationVerifier();
            const verified = await verifier.cryptographicallySecureVerify(emailCredential as Credential);
            expect(verified).toBeTruthy();
            
        });

        it('should return true if all validation passes', async () => {
            const myVerifyAnchor : VerifyFunction = (proof) => true;
            const myVerifySignature : VerifyFunction = (proof) => true;
            const verifier = new PresentationVerifier(myVerifyAnchor, myVerifySignature);
            const verified = await verifier.cryptographicallySecureVerify(emailCredential as Credential);
            expect(verified).toBeTruthy();
            
        });

        it('should return false if anchor validation fails', async () => {
            const myVerifyAnchor : VerifyFunction = (proof) => false;
            const myVerifySignature : VerifyFunction = (proof) => true;
            const verifier = new PresentationVerifier(myVerifyAnchor, myVerifySignature);
            const verified = await verifier.cryptographicallySecureVerify(emailCredential as Credential);
            expect(verified).toBeFalsy();
            
        });

        it('should return false if signature validation fails', async () => {
            const myVerifyAnchor : VerifyFunction = (proof) => true;
            const myVerifySignature : VerifyFunction = (proof) => false;
            const verifier = new PresentationVerifier(myVerifyAnchor, myVerifySignature);
            const verified = await verifier.cryptographicallySecureVerify(emailCredential as Credential);
            expect(verified).toBeFalsy();
            
        });
    });

    describe('Verify grant', () => {
        it('should verify grant', () => {
            const requesterId = idDocumentDSR.payload.requesterInfo.requesterId;
            const requestId = idDocumentDSR.payload.id;

            const verifier = new PresentationVerifier();
            const verified = verifier.verifyGrant(idDocumentCredential, requesterId, requestId);
            expect(verified).toBeTruthy();
        });

        it('should fail grant verification if the requesterId is not equal to the value in the original DSR', () => {
            const requesterId = idDocumentDSR.payload.requesterInfo.requesterId + 'extra-str';
            const requestId = idDocumentDSR.payload.id;

            const verifier = new PresentationVerifier();
            const verified = verifier.verifyGrant(idDocumentCredential, requesterId, requestId);
            expect(verified).toBeFalsy();
        });

        it('should fail grant verification if the requestId is not equal to the value in the original DSR', () => {
            const requesterId = idDocumentDSR.payload.requesterInfo.requesterId;
            const requestId = idDocumentDSR.payload.id + 'extra-str';

            const verifier = new PresentationVerifier();
            const verified = verifier.verifyGrant(idDocumentCredential, requesterId, requestId);
            expect(verified).toBeFalsy();
        });
    });
});
