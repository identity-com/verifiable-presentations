import { ScopeRequest } from '@identity.com/dsr';
import { PIIFactory, DSRResponse, Formatters } from '../PIIFactory';
import * as dsrResponse from './fixtures/piiFactory/userPIIFromDsrResponseUsCountry.json';
import * as dsrResponseWithTwoDocuments from './fixtures/piiFactory/userPIIFromDsrResponseUsCountryFrontAndBack.json';
import * as brokenDsrResponse from './fixtures/piiFactory/brokenDsrResponse.json';
import * as dsrRequest from './fixtures/piiFactory/dsrTemplate.json';
import * as idDocumentV3DSR from './fixtures/piiFactory/idDocumentV3DSR.json';
import { schemaLoader, CVCSchemaLoader } from '@identity.com/credential-commons';
schemaLoader.addLoader(new CVCSchemaLoader());
const { verifySignedRequestBody } = ScopeRequest;

const mapping = {
  first_name: { identifier: 'claim-cvc:Name.givenNames-v1' },
  last_name: { identifier: 'claim-cvc:Name.familyNames-v1' },
  date_of_birth: { identifier: 'claim-cvc:Document.dateOfBirth-v1' },
  street: { identifier: 'claim-cvc:Identity.address-v1' },
};

interface StreetClaimFormatter {
  street: string,
  unit: string
}
interface DOBClaimFormatter {
  year: string,
  month: string,
  day: string
}
const formatters: Formatters = {
  street: { format: (claimValue: StreetClaimFormatter) => `${claimValue.street} ${claimValue.unit}` },
  date_of_birth: { format: (claimValue: DOBClaimFormatter) => `${claimValue.year}-${claimValue.month}-${claimValue.day}` },
};

let piiFactory: PIIFactory;
describe('PIIFactory', () => {
  beforeEach(() => {
    piiFactory = new PIIFactory(dsrRequest, mapping, formatters);
  });

  describe('extractPII', () => {
    it('should extract PII and evidenceProofs from a valid DSR Response', async () => {
      const extractedPII = await piiFactory.extractPII(dsrResponse as DSRResponse);

      expect(extractedPII).toEqual({
        formattedClaims: {
          first_name: 'Civic',
          last_name: 'User',
          date_of_birth: '1900-1-1',
          street: '1 Market St Suite 402',
        },
        evidenceProofs: [{
          name: 'credential-cvc:IdDocument-v2',
          proofs: {
            idDocumentFront: {
              algorithm: 'sha256',
              data: '195f9bf62b1a807abe26828c13f29e443169cdc5f60b22b470bfa50eef55a5a4',
            },
          },
        }],
      });
    });

    it('should extract PII from a valid V3 DSR Response', async () => {
      const dsrResponse = idDocumentV3DSR.components.identity.response;
      const extractedPII = await piiFactory.extractPII(dsrResponse as unknown as DSRResponse);
      const { formattedClaims, evidenceProofs } = extractedPII;
      expect(formattedClaims).toEqual({
        first_name: 'Civic',
        last_name: 'User',
        date_of_birth: '1990-1-1',
        street: null, // street is not a claim in the DSR response
      });
    });

    it('should throw an exception if the dsr response is invalid', async () => {
      const shouldFail = piiFactory.extractPII(brokenDsrResponse as DSRResponse);

      return expect(shouldFail).rejects.toThrow('The dsr response on the requirements is invalid');
    });

    it('should extract evidenceProofs for multiple documents if provided in the DSR response', async () => {
      const extractedPII = await piiFactory.extractPII(dsrResponseWithTwoDocuments as DSRResponse);
      expect(extractedPII).toEqual({
        formattedClaims: {
          first_name: 'Civic',
          last_name: 'User',
          date_of_birth: '1900-1-1',
          street: '1 Market St Suite 402'
        },
        evidenceProofs: [
          {
            name: 'credential-cvc:IdDocument-v2',
            proofs: {
              idDocumentFront: {
                algorithm: 'sha256',
                data: '195f9bf62b1a807abe26828c13f29e443169cdc5f60b22b470bfa50eef55a5a4'
              },
              idDocumentBack: {
                algorithm: 'sha256',
                data: '195f9bf62b1a807abe26828c13f29e443169cdc5f60b22b470bfa50eef55a5a4'
              }
            }
          }
        ]
      });
    });
  });

  describe('generateDSR', () => {
    const eventsURL = 'https://testEvents';
    const idvDid = 'did:ethr:0x1a88a35421a4a0d3e13fe4e8ebcf18e9a249dc5a';
    const dsrResolver = {
      id: '123',
      // key pair generated purely for this test
      signingKeys: {
        xpub: '0414a08b13afa8d33c499ec828065775915ddf0301634d35e26c6cec4ad0f0f2b72c79e90357d47c7ba65a3c03bb22ac7e273c5d01494448a155df8a28da33b48d',
        xprv: 'a4947aa34ce507e995a60a455582d97f3fd1163eba3dd990ea1541a8fa049828',
      },
    };
    const urlGeneratorFn = (evidenceName: string) => `https://<test cloud provider>/<unique Id>/${evidenceName}.json`;

    it('should return a generated DSR', async () => {
      const dsr = await piiFactory.generateDSR(eventsURL, idvDid, dsrResolver, urlGeneratorFn);
      const verificationResult = verifySignedRequestBody(dsr);

      expect(verificationResult).toBeTruthy();
    });

  });
  const evidenceProofs = [
    {
      "name": "credential-cvc:IdDocument-v2",
      "proofs": {
        "idDocumentFront": {
          "data": "195f9bf62b1a807abe26828c13f29e443169cdc5f60b22b470bfa50eef55a5a4"
        }
      }
    }
  ];
  describe('expectedDocumentsGivenEvidenceProofs', () => {
    it('should return an array of documents', () => {
      const evidenceProofsResponse = piiFactory.expectedDocumentsGivenEvidenceProofs(evidenceProofs);
      expect(evidenceProofsResponse).toEqual(['idDocumentFront']);
    });
    it('should return an empty array with no evidenceProofs', () => {
      const evidenceProofsResponse = piiFactory.expectedDocumentsGivenEvidenceProofs();
      expect(evidenceProofsResponse).toEqual([]);
    });
  });
});
