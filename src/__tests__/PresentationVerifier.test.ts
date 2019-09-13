import { PresentationVerifier } from '../PresentationVerifier';

describe('PresentationVerifier', () => {
    it('should initialize a PresentationVerifier', () => {
        const presentationManager = new PresentationVerifier();
        expect(presentationManager).toBeDefined();
    });
});
