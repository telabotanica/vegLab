import { Component, OnInit } from '@angular/core';

import { FileData } from 'tb-dropfile-lib/lib/_models/fileData';
import { RejectedFileData } from 'tb-dropfile-lib/lib/_models/rejectedFileData';

import { NotificationService } from 'src/app/_services/notification.service';
import { MetadataService } from 'src/app/_services/metadata.service';

import * as _ from 'lodash';
import * as Papa from 'papaparse';
import * as JSZip from 'jszip';
import * as fileSaver from 'file-saver';

@Component({
  selector: 'vl-sophy-import-and-split-csv',
  templateUrl: './sophy-import-and-split-csv.component.html',
  styleUrls: ['./sophy-import-and-split-csv.component.scss']
})
export class SophyImportAndSplitCsvComponent implements OnInit {
  // Vars File
  allowedFileTypes = ['csv'];
  maxFileSize = 50000;
  uploadedFile: File;
  uploadedFileName: string;
  parsedCsvFile: Array<Array<string>> = [];
  parsingCsvFile = false;
  zippingFile = false;

  // SOPHY file description
  readonly SOPHY = {
    ID:                 { position: 0,  label: 'code_identifiant' },
    RELEVE_ID:          { position: 1,  label: 'code_identifiant_releve' },
    PUBLICATION_ID:     { position: 2,  label: 'numero_publication' },
    PUBLICATION_TITLE:  { position: 3,  label: 'publication' },
    AUTHOR:             { position: 4,  label: 'auteur' },
    YEAR:               { position: 5,  label: 'année' },
    TABLE_NUMBER:       { position: 6,  label: 'numero_tableau' },
    RELEVE_NUMBER:      { position: 7,  label: 'numero_releve' },
    STATION:            { position: 8,  label: 'nom_station' },
    INSEE_ID:           { position: 9, label: 'code_insee' },
    INSEE_ID_ESTIMATED: { position: 10, label: 'code_insee_calcule' },
    ELEVATION:          { position: 11, label: 'altitude' },
    LAT_WGS:            { position: 12, label: 'ss_latitude_wgs' },
    LNG_WGS:            { position: 13, label: 'ss_longitude_wgs' },
    UTM_EAST:           { position: 14, label: 'ss_utmEasting' },
    UTM_NORTH:          { position: 15, label: 'ss_utmNorthing' },
    UTM_ZONE:           { position: 16, label: 'ss_utmZone' },
    GEO_ACCURACY:       { position: 17, label: 'ss_ce_precision_geographique' },
    SCI_NAME:           { position: 18, label: 'nom_scientifique' },
    SCI_NAME_INITIAL:   { position: 19, label: 'nom_scientifique_initial' },
    SCI_NAME_RETAINED:  { position: 20, label: 'nom_scientifique_retenu' },
    ST_FOURNIER:        { position: 21, label: 'st_ce_num_fournier' },
    ST_FLEUR:           { position: 22, label: 'st_ce_num_floeur' },
    ST_ALGUE:           { position: 23, label: 'st_ce_num_algues' },
    ST_CHARA:           { position: 24, label: 'st_ce_num_characees' },
    ST_BRYO:            { position: 25, label: 'st_ce_num_bryo' },
    ST_LICH:            { position: 26, label: 'st_ce_num_lichen' },
    ST_SYNTRI:          { position: 27, label: 'st_ce_num_syntri' },
    ST_BDNFF:           { position: 28, label: 'st_ce_num_bdnff' },
    ST_CIFF:            { position: 29, label: 'st_ce_num_ciff' },
    ST_FR94:            { position: 30, label: 'st_ce_num_codefr94' },
    FLORE:              { position: 31, label: 'flore' },
    LAYER:              { position: 32, label: 'strate' },
    COEF:               { position: 33, label: 'code_abondance' },
    BDTFX_NUM_NOM:      { position: 34, label: 'BDNFF_NUM_NOM' },
    COMMUNE:            { position: 35, label: 'Commune' },
    DEPARTEMENT:        { position: 36, label: 'Departement' },
    PAYS:               { position: 37, label: 'Pays' }
  };

  // SOPHY (internal) metadata headers
  readonly sophyMetaHeaderBase: Array<Array<string>> = [
    ['', '', '', 'sophy_data'],
    ['', '', '', 'sophy_data_complete'],
    ['', '', '', 'sophy_import_code_identifiant_releve'],
    ['', '', '', 'sophy_import_numero_publication'],
    ['', '', '', 'sophy_import_publication'],
    ['', '', '', 'sophy_import_auteur'],
    ['', '', '', 'sophy_import_annee'],
    ['', '', '', 'sophy_import_numero_tableau'],
    ['', '', '', 'sophy_import_numero_releve'],
    ['', '', '', 'sophy_import_nom_station'],
    ['', '', '', 'sophy_import_code_insee'],
    ['', '', '', 'sophy_import_code_insee_calcule'],
    ['', '', '', 'sophy_import_altitude'],
    ['', '', '', 'sophy_import_ss_latitude_wgs'],
    ['', '', '', 'sophy_import_ss_longitude_wgs'],
    ['', '', '', 'sophy_import_ss_utm_easting'],
    ['', '', '', 'sophy_import_ss_utm_northing'],
    ['', '', '', 'sophy_import_ss_utm_zone'],
    ['', '', '', 'sophy_import_ss_ce_precision_geographique']
  ];

  // CSV sections vars
  header: Array<string> = [];
  rawDataGroupedByPubli: _.Dictionary<Array<Array<string>>> = null;

  data: Array<{
    publicationId: string,
    publicationTitle: string,
    rawTables: Array<{
      tableId: string,
      rawReleves?: Array<SophyRawReleve>
    }>,
    tables?: Array<{
      tableId: string,
      content: Array<Array<string>>
    }>
  }> = [];

  tableViews: Array<{
    publicationId: string,
    tableId: string,
    view: Array<Array<string>>,
    blob: Blob
  }> = [];

  constructor(private notificationService: NotificationService,
              private metadataService: MetadataService) { }

  ngOnInit() {
  }

  /**
   * File import
   */
  acceptedFiles(data: Array<FileData>): void {
    if (data.length > 1) {
      // Can't upload more than one file
    } else if (data.length === 0) {
      // No file
    } else if (data.length === 1) {
      // Ok, continue
      this.uploadedFile = data[0].file;
      this.uploadedFileName = this.uploadedFile.name.replace('.csv', '');
      this.readCsvFile();
    }
  }

  rejectedFiles(data: Array<RejectedFileData>): void {
    this.notificationService.error(`Le fichier ne peut pas être importé : "${data[0].message}"`);
  }

  deletedFiles(data: Array<FileData>): void {
    this.resetComponent();
  }

  resetComponent(): void {
    this.uploadedFile = null;
    this.uploadedFileName = null;
    this.zippingFile = false;
    this.parsingCsvFile = false;
    this.parsedCsvFile = [];
    this.header = [];
    this.rawDataGroupedByPubli = null;
    this.data = [];
    this.tableViews = [];
  }

  /**
   * CSV parser
   * Reads this.uploadedFile File
   */
  readCsvFile(): void {
    if (this.uploadedFile) {
      this.parsingCsvFile = true;
      Papa.parse(this.uploadedFile, {
        complete: results => {
          this.parsingCsvFile = false;
          if (results.errors.length > 0) {
            // Csv file has some errors, log to user and abort
            this.notificationService.error(results.errors.toString());
          } else {
            this.parsedCsvFile = results.data;
            if (this.checkCsvFile()) {
              this.splitCsvFile();
              if (this.checkSophyMetaHeadersExists()) {
                this.prepareViews();
                this.createView();
              } else {
                // Should create SOPHY Meta
                this.notificationService.notify('Les métadonnées SOPHY ne sont pas initialisées. Contactez l\'administrateur');
              }
            } else {
              this.notificationService.error('Le fichier n\'est pas conforme');
            }
          }
        }
      });
    } else {
      this.notificationService.error('Erreur lors de la lecture du fichier');
    }
  }

  /**
   * CSV File checks
   */
  checkCsvFile(): boolean {
    return true;
  }

  /**
   * Returns a property (cell value) from a table row
   */
  getRawTableProperty(rows: Array<Array<string>>, propertyIndex: number): string {
    const propertyValues = _.map(rows, r => r[propertyIndex]);
    const property = _.uniq(_.compact(propertyValues));
    if (property && property !== null && property.length === 1) {
      const _cleanStr = property[0].replace(/ +(?= )/g, '').replace(/"/g, '\'').replace(/;/g, ',').replace(' . , ', ', ').replace('.,', ',').trim();
      return _cleanStr;
    } else if (property && property !== null && property.length > 1) {
      // Several values
      return null;
    } else {
      return null;
    }
  }

  /**
   * Fills `this.data` by grouping relevés by publication and tables
   */
  splitCsvFile(): void {
    if (this.parsedCsvFile) {
      // 1. Splice Header
      this.header = this.parsedCsvFile.splice(0, 1)[0];

      // 1'. Check header
      // @Todo

      // 2. Group by publication id
      this.rawDataGroupedByPubli = _.groupBy(this.parsedCsvFile, pcf => pcf[this.SOPHY.PUBLICATION_ID.position]);
      for (const keyPubliId in this.rawDataGroupedByPubli) {
        if (this.rawDataGroupedByPubli.hasOwnProperty(keyPubliId)) {
          const publication = this.rawDataGroupedByPubli[keyPubliId];
          const currentPublicationId = keyPubliId;
          const currentPublicationTitle = publication[0][this.SOPHY.PUBLICATION_TITLE.position];

          const groupedTables = _.groupBy(publication, p => p[this.SOPHY.TABLE_NUMBER.position]);
          const tables: Array<{
            tableId: string,
            rawReleves?: Array<SophyRawReleve>
          }> = [];

          // 3. Group by table id
          for (const keyTableId in groupedTables) {
            if (groupedTables.hasOwnProperty(keyTableId)) {
              const table = groupedTables[keyTableId];
              const currentTableId = keyTableId;
              const currentTable = table;

              const releves: Array<SophyRawReleve> = [];

              const groupedReleves = _.groupBy(currentTable, ct => ct[this.SOPHY.RELEVE_ID.position]);

              // 4. Group by releves id
              for (const keyReleveId in groupedReleves) {
                if (groupedReleves.hasOwnProperty(keyReleveId)) {
                  const currentReleve = groupedReleves[keyReleveId];

                  // Relevé vars
                  const releveId    = this.getRawTableProperty(currentReleve, this.SOPHY.RELEVE_NUMBER.position);
                  const station     = this.getRawTableProperty(currentReleve, this.SOPHY.STATION.position);
                  const inseeId     = this.getRawTableProperty(currentReleve, this.SOPHY.INSEE_ID.position);
                  const elevation   = this.getRawTableProperty(currentReleve, this.SOPHY.ELEVATION.position);
                  const author      = this.getRawTableProperty(currentReleve, this.SOPHY.AUTHOR.position);
                  const date        = this.parseDate(this.getRawTableProperty(currentReleve, this.SOPHY.YEAR.position));
                  const latitude    = this.getRawTableProperty(currentReleve, this.SOPHY.LAT_WGS.position);
                  const longitude   = this.getRawTableProperty(currentReleve, this.SOPHY.LNG_WGS.position);
                  const city        = this.getRawTableProperty(currentReleve, this.SOPHY.COMMUNE.position);
                  const departement = this.getRawTableProperty(currentReleve, this.SOPHY.DEPARTEMENT.position);
                  const country     = this.getRawTableProperty(currentReleve, this.SOPHY.PAYS.position);
                  const refBiblio   = this.getRawTableProperty(currentReleve, this.SOPHY.PUBLICATION_TITLE.position);

                  // Relevé metadata
                  const sophyMeta: SophyMeta = {
                    sophy_data: true,
                    sophy_complete: false,
                    sophy_import_code_identifiant_releve: this.getRawTableProperty(currentReleve, this.SOPHY.RELEVE_NUMBER.position),
                    sophy_import_numero_publication: this.getRawTableProperty(currentReleve, this.SOPHY.PUBLICATION_ID.position),
                    sophy_import_publication: this.getRawTableProperty(currentReleve, this.SOPHY.PUBLICATION_TITLE.position),
                    sophy_import_auteur: this.getRawTableProperty(currentReleve, this.SOPHY.AUTHOR.position),
                    sophy_import_annee: this.getRawTableProperty(currentReleve, this.SOPHY.YEAR.position),
                    sophy_import_numero_tableau: this.getRawTableProperty(currentReleve, this.SOPHY.TABLE_NUMBER.position),
                    sophy_import_numero_releve: this.getRawTableProperty(currentReleve, this.SOPHY.RELEVE_NUMBER.position),
                    sophy_import_nom_station: this.getRawTableProperty(currentReleve, this.SOPHY.STATION.position),
                    sophy_import_code_insee: this.getRawTableProperty(currentReleve, this.SOPHY.INSEE_ID.position),
                    sophy_import_code_insee_calcule: this.getRawTableProperty(currentReleve, this.SOPHY.INSEE_ID_ESTIMATED.position),
                    sophy_import_altitude: this.getRawTableProperty(currentReleve, this.SOPHY.ELEVATION.position),
                    sophy_import_ss_latitude_wgs: this.getRawTableProperty(currentReleve, this.SOPHY.LAT_WGS.position),
                    sophy_import_ss_longitude_wgs: this.getRawTableProperty(currentReleve, this.SOPHY.LNG_WGS.position),
                    sophy_import_ss_utm_easting: this.getRawTableProperty(currentReleve, this.SOPHY.UTM_EAST.position),
                    sophy_import_ss_utm_northing: this.getRawTableProperty(currentReleve, this.SOPHY.UTM_NORTH.position),
                    sophy_import_ss_utm_zone: this.getRawTableProperty(currentReleve, this.SOPHY.UTM_ZONE.position),
                    sophy_import_ss_ce_precision_geographique: this.getRawTableProperty(currentReleve, this.SOPHY.GEO_ACCURACY.position),
                  };

                  releves.push({
                    releveId,
                    station,
                    latitude,
                    longitude,
                    inseeId,
                    elevation,
                    city,
                    departement,
                    country,
                    author,
                    date,
                    refBiblio,
                    sophyMeta,
                    content: currentReleve
                  });
                }
              }


              tables.push({tableId: currentTableId, rawReleves: releves});
            }
          }

          this.data.push({
            publicationId: currentPublicationId,
            publicationTitle: currentPublicationTitle,
            rawTables: tables
          });
        }
      }
    }
  }

  prepareViews(): void {
    if (!this.data || this.data == null || this.data.length === 0) {
      this.notificationService.error('Aucune données issues du fichier suite à la lecture de celui-ci');
      return;
    }

    for (const publication of this.data) {

      for (const rawTable of publication.rawTables) {

        // 1. Set rowDefinitions
        const rowDefinitions: Array<{
          repository: string,
          nomen: string,
          layer: string,
          name: string,
          coefs?: Array<Array<string>>
        }> = [];

        const rowDefinitionsWithDuplicates: Array<{
          repository: string,
          nomen: string,
          layer: string,
          name: string
        }> = [];

        rawTable.rawReleves.forEach(rr => {
          const r = _.map(rr.content, row => {
            return {
              repository: this.getRepository(row),
              nomen: this.getNomen(row),
              layer: this.getLayer(row),
              name: this.getName(row)
            };
          });
          rowDefinitionsWithDuplicates.push(...r);
        });

        const uniqRD = _.uniqBy(rowDefinitionsWithDuplicates, rdwd => rdwd.repository + rdwd.nomen + rdwd.name);
        rowDefinitions.push(...uniqRD);

        const table: Array<Array<string>> = [];

        // 2. Set row definition
        for (let index = 0; index < rowDefinitions.length; index++) {
          const rowDef = rowDefinitions[index];
          table.push([rowDef.repository, rowDef.nomen, rowDef.layer, rowDef.name]);
        }

        if (!publication.tables || publication.tables == null || publication.tables.length === 0) { publication.tables = []; }
        publication.tables.push({tableId: rawTable.tableId, content: table});

      }

      // 2. Set coefs
      for (const rawTable of publication.rawTables) {
        const rawTableId = rawTable.tableId;
        const table = _.find(publication.tables, t => t.tableId === rawTableId);

        rawTable.rawReleves.forEach(rawReleve => {
          // get rawReleve row def + coef
          const rowsDefWithCoef = _.map(rawReleve.content, row => {
            return {
              repository: this.getRepository(row),
              nomen: this.getNomen(row),
              layer: this.getLayer(row),
              name: this.getName(row),
              coef: this.getCoef(row)
            };
          });

          // Find corresping row in table & set coef
          table.content.forEach(tableRow => {
            const sourceRow = _.find(rowsDefWithCoef, rdwc => tableRow[0] === rdwc.repository &&
                                                              tableRow[1] === rdwc.nomen &&
                                                              tableRow[2] === rdwc.layer &&
                                                              tableRow[3] === rdwc.name);
            if (sourceRow && sourceRow !== null) {
              tableRow.push(sourceRow.coef);
            } else {
              tableRow.push('');
            }
          });
        });
      }
    }
  }

  checkSophyMetaHeadersExists(): boolean {
    // Check that metadata exists
    if (this.sophyMetaHeaderBase == null || this.sophyMetaHeaderBase !== null && this.sophyMetaHeaderBase.length === 0) { return false; }
    for (const sophyMeta of this.sophyMetaHeaderBase) {
      if (this.metadataService.getMetadataByFieldId(sophyMeta[3], false) == null) {
        // Metadata does not exists
        return false;
      }
    }
    return true;
  }

  createView(): void {
    if ( (!this.data || this.data == null) || this.data.length === 0 ) {
      return;
    }

    for (const publication of this.data) {
      for (const rawTable of publication.rawTables) {
        // Create main headers
        const mainHeader: Array<Array<string>> = [
          ['', '', '', 'Groupe'],
          ['', '', '', 'Numéro de relevé'],
          ['', '', '', 'Auteur'],
          ['', '', '', 'Date']
        ];
        for (const rawReleve of rawTable.rawReleves) {
          mainHeader[0].push('A');
          mainHeader[1].push(rawReleve.releveId);
          mainHeader[2].push(rawReleve.author);
          mainHeader[3].push(rawReleve.date);
        }

        // Create location headers
        const locationHeader: Array<Array<string>> = [
          ['', '', '', 'Latitude'],
          ['', '', '', 'Longitude'],
          ['', '', '', 'Altitude'],
          ['', '', '', 'Pays'],
          ['', '', '', 'Département'],
          ['', '', '', 'Commune'],
          ['', '', '', 'Lieu'],
        ];
        for (const rawReleve of rawTable.rawReleves) {
          if (this.rawReleveHasLocation(rawReleve)) {
            // rawReleve has 'Commune'...
            locationHeader[0].push('');
            locationHeader[1].push('');
            locationHeader[2].push(rawReleve.elevation);
            locationHeader[3].push(rawReleve.country);
            locationHeader[4].push(rawReleve.departement);
            locationHeader[5].push(!this.isNullValue(rawReleve.city) ? rawReleve.city : '');
            locationHeader[6].push(this.getRawTableProperty(rawReleve.content, this.SOPHY.STATION.position));
          } else {
            locationHeader[0].push(this.getRawTableProperty(rawReleve.content, this.SOPHY.LAT_WGS.position));
            locationHeader[1].push(this.getRawTableProperty(rawReleve.content, this.SOPHY.LNG_WGS.position));
            locationHeader[2].push(rawReleve.elevation);
            locationHeader[3].push('');
            locationHeader[4].push('');
            locationHeader[5].push('');
            locationHeader[6].push('');
          }
        }

        // Create Validation headers
        const validationHeader: Array<Array<string>> = [
          ['', '', '', 'Référentiel'],
          ['', '', '', 'Numéro nomenclatural']
        ];
        // No validation given => fill with empty values
        this.fillArrayWithValue(validationHeader[0], rawTable.rawReleves.length, '');
        this.fillArrayWithValue(validationHeader[1], rawTable.rawReleves.length, '');

        // Create Biblio header
        const biblioHeader: Array<Array<string>> = [
          ['', '', '', 'Ref. biblio.']
        ];
        for (const rawReleve of rawTable.rawReleves) {
          biblioHeader[0].push(rawReleve.refBiblio);
        }

        const sophyMetaHeader: Array<Array<string>> = [
          ['', '', '', 'sophy_data'],
          ['', '', '', 'sophy_data_complete'],
          ['', '', '', 'sophy_import_code_identifiant_releve'],
          ['', '', '', 'sophy_import_numero_publication'],
          ['', '', '', 'sophy_import_publication'],
          ['', '', '', 'sophy_import_auteur'],
          ['', '', '', 'sophy_import_annee'],
          ['', '', '', 'sophy_import_numero_tableau'],
          ['', '', '', 'sophy_import_numero_releve'],
          ['', '', '', 'sophy_import_nom_station'],
          ['', '', '', 'sophy_import_code_insee'],
          ['', '', '', 'sophy_import_code_insee_calcule'],
          ['', '', '', 'sophy_import_altitude'],
          ['', '', '', 'sophy_import_ss_latitude_wgs'],
          ['', '', '', 'sophy_import_ss_longitude_wgs'],
          ['', '', '', 'sophy_import_ss_utm_easting'],
          ['', '', '', 'sophy_import_ss_utm_northing'],
          ['', '', '', 'sophy_import_ss_utm_zone'],
          ['', '', '', 'sophy_import_ss_ce_precision_geographique']
        ];

        for (const rawReleve of rawTable.rawReleves) {
          sophyMetaHeader[0].push('true');
          sophyMetaHeader[1].push(rawReleve.sophyMeta.sophy_complete.toString());
          sophyMetaHeader[2].push(rawReleve.sophyMeta.sophy_import_code_identifiant_releve);
          sophyMetaHeader[3].push(rawReleve.sophyMeta.sophy_import_numero_publication);
          sophyMetaHeader[4].push(rawReleve.sophyMeta.sophy_import_publication);
          sophyMetaHeader[5].push(rawReleve.sophyMeta.sophy_import_auteur);
          sophyMetaHeader[6].push(rawReleve.sophyMeta.sophy_import_annee);
          sophyMetaHeader[7].push(rawReleve.sophyMeta.sophy_import_numero_tableau);
          sophyMetaHeader[8].push(rawReleve.sophyMeta.sophy_import_numero_releve);
          sophyMetaHeader[9].push(rawReleve.sophyMeta.sophy_import_nom_station);
          sophyMetaHeader[10].push(rawReleve.sophyMeta.sophy_import_code_insee);
          sophyMetaHeader[11].push(rawReleve.sophyMeta.sophy_import_code_insee_calcule);
          sophyMetaHeader[12].push(rawReleve.sophyMeta.sophy_import_altitude);
          sophyMetaHeader[13].push(rawReleve.sophyMeta.sophy_import_ss_latitude_wgs);
          sophyMetaHeader[14].push(rawReleve.sophyMeta.sophy_import_ss_longitude_wgs);
          sophyMetaHeader[15].push(rawReleve.sophyMeta.sophy_import_ss_utm_easting);
          sophyMetaHeader[16].push(rawReleve.sophyMeta.sophy_import_ss_utm_northing);
          sophyMetaHeader[17].push(rawReleve.sophyMeta.sophy_import_ss_utm_zone);
          sophyMetaHeader[18].push(rawReleve.sophyMeta.sophy_import_ss_ce_precision_geographique);
        }

        // Concatenate headers & table
        const headers = _.concat(mainHeader, locationHeader, validationHeader, biblioHeader, sophyMetaHeader);
        const table = _.find(publication.tables, t => t.tableId === rawTable.tableId);
        const mergedData: Array<Array<string>> = _.clone(headers);

        mergedData.push(['Référentiel', 'Nomen', 'Strate']);
        this.fillArrayWithValue(mergedData[mergedData.length - 1], rawTable.rawReleves.length, '');

        for (const row of table.content) {
          // const _row = _.concat(['', '', ''], row);
          mergedData.push(row);
        }

        this.tableViews.push({publicationId: publication.publicationId, tableId: table.tableId, view: mergedData, blob: this.arrayToBlob(mergedData)});
      }
    }

  }

  /**
   * ZIP all tables and download
   */
  zipAndDownload(): void {
    if (!this.tableViews || this.tableViews == null || this.tableViews.length === 0) { return; }
    const zip: JSZip = new JSZip();
    this.zippingFile = true;

    for (const view of this.tableViews) {
      zip.file(`${view.publicationId}-${view.tableId}.csv`, view.blob);
    }

    zip.generateAsync({type: 'blob'}).then(content => {
      this.zippingFile = false;
      fileSaver.saveAs(content, `${this.uploadedFileName}.zip`);
    });
  }

  // -------
  // HELPERS
  // -------

  /**
   * Return a Blob from parsed data (`this.data`)
   */
  arrayToBlob(data: Array<Array<string>>): Blob {
    const csvContent = 'data:text/csv;charset=utf-8;';
    const result = data.map(e => e.join(';')).join('\n');

    const blob = new Blob([result], { type: csvContent });

    return blob;
  }

  getRepository(row: Array<string>): string {
    if (!row || row == null || row.length === 0) {
      return null;
    }

    const bdtfxNomen = row[this.SOPHY.BDTFX_NUM_NOM.position];
    const flore = row[this.SOPHY.FLORE.position];
    if (bdtfxNomen && bdtfxNomen !== null && !this.isNullValue(bdtfxNomen)) {
      return 'bdtfx';
    } else if (flore && flore !== null && !this.isNullValue(flore)) {
      return flore;
    } else {
      return 'otherunknown';
    }
  }

  getNomen(row: Array<string>): string {
    if (!row || row == null || row.length === 0) {
      return null;
    }

    const repo = this.getRepository(row);

    let nomen: string = null;
    if (repo === 'bdtfx') {
      nomen = row[this.SOPHY.BDTFX_NUM_NOM.position];
    } else {
      const fournierNomen = row[this.SOPHY.ST_FOURNIER.position];
      const fleurNomen    = row[this.SOPHY.ST_FLEUR.position];
      const algueNomen    = row[this.SOPHY.ST_ALGUE.position];
      const charaNomen    = row[this.SOPHY.ST_CHARA.position];
      const bryoNomen     = row[this.SOPHY.ST_BRYO.position];
      const lichenNomen   = row[this.SOPHY.ST_LICH.position];
      const syntrNomen    = row[this.SOPHY.ST_SYNTRI.position];
      const bdnffNomen    = row[this.SOPHY.ST_BDNFF.position];
      const ciffNomen     = row[this.SOPHY.ST_CIFF.position];
      const fr94Nomen     = row[this.SOPHY.ST_FR94.position];

      nomen = fournierNomen !== '0' ? fournierNomen :
        fleurNomen  !== '0' ? fleurNomen :
        algueNomen  !== '0' ? algueNomen :
        charaNomen  !== '0' ? algueNomen :
        bryoNomen   !== '0' ? bryoNomen :
        lichenNomen !== '0' ? lichenNomen :
        syntrNomen  !== '0' ? syntrNomen :
        bdnffNomen  !== '0' ? bdnffNomen :
        ciffNomen   !== '0' ? ciffNomen :
        fr94Nomen   !== '0' ? fr94Nomen : null;
    }

    return nomen;
  }

  getLayer(row: Array<string>): string {
    if (!row || row == null || row.length === 0) {
      return null;
    }

    let layer = row[this.SOPHY.LAYER.position];

    layer = layer === '0' ? 'h' :
            layer === '1' ? 'a' :
            layer === '2' ? 'A' :
            layer === '3' ? 'h' :
            layer === '4' ? 'h' :
            layer === '5' ? 'h' : 'h';

    return layer;
  }

  getName(row: Array<string>): string {
    if (!row || row == null || row.length === 0) {
      return null;
    }

    const n1 = row[this.SOPHY.SCI_NAME.position];
    const n2 = row[this.SOPHY.SCI_NAME_INITIAL.position];
    const n3 = row[this.SOPHY.SCI_NAME_RETAINED.position];

    if (!this.isNullValue(n1)) {
      return n1;
    } else if (!this.isNullValue(n2)) {
      return n2;
    } else if (!this.isNullValue(n3)) {
      return n3;
    } else {
      return '?';
    }
  }

  getCoef(row: Array<string>): string {
    if (!row || row == null || row.length === 0) {
      return '';
    }

    const coef = row[this.SOPHY.COEF.position];

    return coef && coef !== null ? coef : '';
  }

  parseDate(year: string): string {
    return `00/00/${year}`;
  }

  isNullValue(value: string): boolean {
    const _value = value.trim();
    if (!_value || _value == null) {
      return true;
    } else if (_value === '#N/A') {
      return true;
    } else if (_value === '') {
      return true;
    } else {
      return false;
    }
  }

  fillArrayWithValue(arr: Array<string>, count: number, value: string): void {
    for (let index = 0; index < count; index++) {
      arr.push(value);
    }
  }

  rawReleveHasLocation(rawReleve: SophyRawReleve): boolean {
    if (!rawReleve || rawReleve == null) { return false; }
    if (!this.isNullValue(rawReleve.city) && !this.isNullValue(rawReleve.departement)) {
      return true;
    } else if (this.isNullValue(rawReleve.city) && !this.isNullValue(rawReleve.departement)) {
      return true;
    } else {
      return false;
    }
  }
}

export interface SophyRawReleve {
  releveId: string;
  latitude: string;
  longitude: string;
  station: string;
  inseeId: string;
  elevation: string;
  city: string;
  departement: string;
  country: string;
  author: string;
  date: string;
  refBiblio: string;
  sophyMeta: SophyMeta;
  content: Array<Array<string>>;
}

// SOPHY Metadata
export interface SophyMeta {
  sophy_data:                                 boolean;
  sophy_complete:                             boolean;
  sophy_import_code_identifiant?:             string;
  sophy_import_code_identifiant_releve?:      string;
  sophy_import_numero_publication?:           string;
  sophy_import_publication?:                  string;
  sophy_import_auteur?:                       string;
  sophy_import_annee?:                        string;
  sophy_import_numero_tableau?:               string;
  sophy_import_numero_releve?:                string;
  sophy_import_nom_station?:                  string;
  sophy_import_code_insee?:                   string;
  sophy_import_code_insee_calcule?:           string;
  sophy_import_altitude?:                     string;
  sophy_import_ss_latitude_wgs?:              string;
  sophy_import_ss_longitude_wgs?:             string;
  sophy_import_ss_utm_easting?:               string;
  sophy_import_ss_utm_northing?:              string;
  sophy_import_ss_utm_zone?:                  string;
  sophy_import_ss_ce_precision_geographique?: string;
}

