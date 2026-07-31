import React from 'react';
import { renderToString } from 'react-dom/server';
import ReviewJobModal from './src/components/modals/ReviewJobModal.jsx';

const extractedData = {"company":"Facebook","job_title":"React Developer","location":"Remote","salary":null,"employment_type":null,"experience":null,"remote":true,"job_url":null,"deadline":null,"skills":null};

console.log(renderToString(<ReviewJobModal open={true} extractedData={extractedData} />));
