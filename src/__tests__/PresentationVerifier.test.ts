import _ from 'lodash';
import { Credential } from '../Credential';
import { PresentationVerifier } from '../PresentationVerifier';
import emailCredential from './fixtures/emailCredential.json';
import emailCredential2 from './fixtures/emailCredential.json';

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
            const invalidEmailCredential = _.clone(emailCredential);
            const invalidClaim = _.clone(emailCredential.claim);
            invalidClaim.contact.email.username = 'invalid';
            invalidEmailCredential.claim = invalidClaim;

            const verified = verifier.nonCryptographicallySecureVerify(invalidEmailCredential as Credential);
            expect(verified).toBeFalsy();
        });

        it('should return false if a leave target hash does not match', () => {
            const invalidEmailCredential = _.clone(emailCredential);
            invalidEmailCredential.proof.leaves[0].targetHash += 'a';

            const verified = verifier.nonCryptographicallySecureVerify(invalidEmailCredential as Credential);
            expect(verified).toBeFalsy();
        });

        it('should return false if a leave has an invalid value', () => {
            const invalidEmailCredential = _.clone(emailCredential);
            invalidEmailCredential.proof.leaves[0].value += 'a';

            const verified = verifier.nonCryptographicallySecureVerify(invalidEmailCredential as Credential);
            expect(verified).toBeFalsy();
        });
    });
});
