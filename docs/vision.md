# ZK Invoices Ideation

Using this document as a brain dump for now, will add more details as we progress on the project.

**The idea of this application is originated from a personal requirement:**
How do I create a system, where I can raise money from different people to invest in a business and then proof it to them that I've put that money in good use. And also prove the percent of return that they are getting for their investment.

### Thu, 30 Nov, 2023

I want to create a generic application that can be used to prove:
- validity of invoices.
- generate proof of payment for invoices.
- generate proof of payment received for invoices.
- create a escrow based settlement system.

**High Level Vision**
Create a system which can enable independent systems to create provable invoices using this platform.
I have a need to create a invoice system for the supply chain management. So everytime I get something out of a warehous, I have to pay labour, contractor, logistics, packaging and transport. So All these invoices would be sent to the owner of the business by the system on behalf of the system.

**Why create provable invoices and settlement system**
To bring trust in supply chain financing.

**Features in the PoC**

- Allow different users to create accounts and send invoices.
- Allow users to see the invoices that they have received.
- Ability to create invoices and commit proof of validity of state on-chain (the merkle root)
