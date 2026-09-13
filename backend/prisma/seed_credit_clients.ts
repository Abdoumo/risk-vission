import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';

const prisma = new PrismaClient();

async function main() {
  const results: any[] = [];
  const csvPath = path.join(__dirname, 'real_clients.csv');

  console.log('Reading CSV from:', csvPath);

  fs.createReadStream(csvPath)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      console.log(`Parsed ${results.length} rows. Clearing old records...`);
      await prisma.creditClient.deleteMany({});
      
      console.log('Inserting into database...');
      let inserted = 0;
      
      for (const row of results) {
        // Parse floats and ints safely
        const solde = parseFloat(row['Solde_Compte_DZD']) || 0;
        const revenu = parseFloat(row['Revenu_Mensuel_DZD']) || 0;
        const montantCredit = parseFloat(row['Montant_Credit_DZD']) || 0;
        const duree = parseInt(row['Duree_Credit_Mois']) || 0;
        const echeance = parseFloat(row['Echeance_Mensuelle_DZD']) || 0;
        const impayes = parseFloat(row['Impayes_DZD']) || 0;
        const joursRetard = parseInt(row['Jours_Retard']) || 0;
        const provision = parseFloat(row['Provision_DZD']) || 0;
        
        // Simulate Cashflow & Overdraft
        let cashflow = revenu * (0.3 - Math.random() * 0.4); // -10% to +30% of revenue
        if (impayes > 0 || joursRetard > 30) {
            cashflow = revenu * (-0.1 - Math.random() * 0.4); // Negative skew
        }
        
        let overdraft = 'Aucun';
        const rand = Math.random();
        if (solde < 100000) {
            if (rand < 0.2) overdraft = 'Faible';
            else if (rand < 0.6) overdraft = 'Modere';
            else if (rand < 0.8) overdraft = 'Frequent';
            else overdraft = 'Eleve';
        } else if (solde < 500000) {
            if (rand < 0.1) overdraft = 'Modere';
            else if (rand < 0.3) overdraft = 'Faible';
        }

        await prisma.creditClient.create({
          data: {
            client_id: row['Client_ID'],
            type_client: row['Type_Client'] || 'Inconnu',
            nom: row['Nom'] || 'Inconnu',
            prenom: row['Prenom'] || 'Inconnu',
            wilaya: row['Wilaya'] || 'Inconnu',
            ville: row['Ville'] || 'Inconnu',
            agence: row['Agence'] || 'Inconnu',
            secteur_activite: row['Secteur_Activite'] || 'Inconnu',
            type_compte: row['Type_Compte'] || 'Courant',
            solde_compte_dzd: solde,
            revenu_mensuel_dzd: revenu,
            type_credit: row['Type_Credit'] || 'Aucun',
            montant_credit_dzd: montantCredit,
            duree_credit_mois: duree,
            echeance_mensuelle_dzd: echeance,
            impayes_dzd: impayes,
            jours_retard: joursRetard,
            classe_creance: row['Classe_Creance'] || 'Saine',
            provision_dzd: provision,
            date_credit: row['Date_Credit'] || null,
            statut_client: row['Statut_Client'] || 'Prospect',
            cashflow_dzd: cashflow,
            overdraft: overdraft
          }
        });
        inserted++;
      }
      
      console.log(`Successfully inserted ${inserted} clients!`);
    });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
