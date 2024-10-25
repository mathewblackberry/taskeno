package au.com.blacksaltit.invoice.pdf;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.apache.fop.apps.FOPException;
import org.apache.fop.apps.FOUserAgent;
import org.apache.fop.apps.Fop;
import org.apache.fop.apps.FopFactory;
import org.apache.hc.client5.http.classic.methods.HttpPost;
import org.apache.hc.client5.http.classic.methods.HttpPut;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.CloseableHttpResponse;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.core5.http.ContentType;
import org.apache.hc.core5.http.io.entity.ByteArrayEntity;
import org.apache.hc.core5.http.io.entity.StringEntity;
import org.apache.xmlgraphics.util.MimeConstants;
import org.w3c.dom.Document;
import org.xml.sax.InputSource;
import org.xml.sax.SAXException;
import software.amazon.awssdk.auth.credentials.EnvironmentVariableCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.secretsmanager.SecretsManagerClient;
import software.amazon.awssdk.services.secretsmanager.model.GetSecretValueRequest;
import software.amazon.awssdk.services.secretsmanager.model.GetSecretValueResponse;
import software.amazon.awssdk.services.secretsmanager.model.SecretsManagerException;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.transform.*;
import javax.xml.transform.sax.SAXResult;
import javax.xml.transform.stream.StreamResult;
import javax.xml.transform.stream.StreamSource;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;

public class PdfGenerator {

    private static final String SECRET_NAME = "xero-api-tokens";
    private static final String REGION = System.getenv("AWS_REGION");
    private static final String TOKEN_URL = "https://identity.xero.com/connect/token";
    private static final String CLIENT_ID = "B0E35429D87C4BD69BBE1BE7195D49A0";
    private static final String CLIENT_SECRET = "FxARTsteP8wKJwcmcypPH1S9NV2zZBzcUFYU2NhI0uInlAUD";
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();


    private final Log log = LogFactory.getLog(this.getClass());
    private String homeDir = System.getProperty("user.home");
    private FopFactory fopFactory;
//    private FopFactory fopFactory = FopFactory.newInstance(new File(homeDir + "/ideaProjects/keno/modules/invoice-pdf/xslt/").toURI());

    public void execute() {
        try {
            copyFontsToTmp();
            InputStream fopConfig = getClass().getResourceAsStream("/fop.xconf");
            fopFactory = FopFactory.newInstance(new File(homeDir + "/ideaProjects/keno/modules/invoice-pdf/xslt/").toURI(), fopConfig);


            System.setProperty("javax.xml.transform.TransformerFactory", "net.sf.saxon.TransformerFactoryImpl");
            Source xsltSrc = new StreamSource(new File(homeDir + "/ideaProjects/keno/config/invoice.xsl"));

            TransformerFactory tFactory = TransformerFactory.newInstance();
            Transformer transformer = tFactory.newTransformer(xsltSrc);

            transformer.setURIResolver((href, base) -> {
                if (href.startsWith("classpath:")) {
                    log.info("ClassPath Loader");
                    // Remove the "classpath:" prefix and load from the classpath
                    String path = href.substring(10);
                    InputStream stream = getClass().getClassLoader().getResourceAsStream(path);
                    if (stream == null) {
                        throw new TransformerException("Resource not found: " + href);
                    }
                    return new StreamSource(stream, href);
                } else {
                    return null;
                }
            });

            transformer.setURIResolver(new URIResolver() {
                @Override
                public Source resolve(String href, String base) throws TransformerException {
                    System.out.println(href);
                    if (href.startsWith("classpath:")) {
                        log.info("ClassPath Loader");

                        // Remove the "classpath:" prefix and load from the classpath
                        String path = href.substring(10);
                        InputStream stream = getClass().getClassLoader().getResourceAsStream(path);
                        if (stream == null) {
                            throw new TransformerException("Resource not found: " + href);
                        }
                        return new StreamSource(stream, href);
                    } else {
                        // For non-classpath resources, return null to let FOP handle them as usual
                        return null;
                    }
                }
            });
            OutputStream pdfOut = new BufferedOutputStream(new FileOutputStream(new File(homeDir + "/ideaProjects/keno/modules/invoice-pdf/xslt/test.pdf")));
            FOUserAgent foUserAgent = fopFactory.newFOUserAgent();
            Fop fop = fopFactory.newFop(MimeConstants.MIME_PDF, foUserAgent, pdfOut);

            Source src = new StreamSource(new StringReader(xmlString));
            Result res = new SAXResult(fop.getDefaultHandler());
            transformer.transform(src, res);
            pdfOut.close();

        } catch (TransformerException ex) {
            log.error("Error Transforming xml");
            ex.printStackTrace();
        } catch (FOPException ex) {
            log.error("Fop Error");
        } catch (FileNotFoundException e) {
            e.printStackTrace();
            throw new RuntimeException(e);
        } catch (Error | IOException e) {
            e.printStackTrace();
        } catch (SAXException e) {
            throw new RuntimeException(e);
        }

//        try {
//
//            String xslFilePath = homeDir + "/ideaProjects/nbscorer/modules/pdf/xslt/scoresheet.xsl";
//            String outputPdfPath = homeDir + "/ideaProjects/nbscorer/modules/pdf/xslt/test.pdf";
//
//            // Step 1: XML and XSLT Transformation
//            TransformerFactory transformerFactory = TransformerFactory.newInstance();
//            Transformer transformer = transformerFactory.newTransformer(new StreamSource(new File(xslFilePath)));
//
//            ByteArrayOutputStream outStream = new ByteArrayOutputStream();
//            transformer.transform(new StreamSource(new ByteArrayInputStream(xmlString.getBytes())), new StreamResult(outStream));
//
//            // Step 2: Setup Apache FOP for PDF generation
//            FOUserAgent foUserAgent = fopFactory.newFOUserAgent();
//            OutputStream pdfOut = Files.newOutputStream(Paths.get(outputPdfPath));
//            Fop fop = fopFactory.newFop(MimeConstants.MIME_PDF, foUserAgent, pdfOut);
//
//            // Step 3: Generating PDF
//            Transformer pdfTransformer = transformerFactory.newTransformer(); // Identity transformer
//            ByteArrayInputStream inStream = new ByteArrayInputStream(outStream.toByteArray());
//            pdfTransformer.transform(new StreamSource(inStream), new SAXResult(fop.getDefaultHandler()));
//
//            pdfOut.close();
//            System.out.println("PDF generated successfully.");
//        } catch (Exception e) {
//            e.printStackTrace();
//        }

    }

    public static void copyFontsToTmp() throws IOException {
        // Define the classpath directory and the target directory
        String[] fontFileNames = {
                "RobotoCondensed-Regular.ttf",
                "RobotoCondensed-Bold.ttf",
                "MaterialIcons-Regular.ttf",
                "Montserrat-Regular.ttf",
                "Montserrat-Bold.ttf",
                "Raleway-Regular.ttf",
                "Raleway-Bold.ttf"
        };

        String tmpFontsDir = "/tmp/fonts/";

        // Create the /tmp/fonts directory if it doesn't exist
        Path tmpFontsPath = Paths.get(tmpFontsDir);
        if (Files.notExists(tmpFontsPath)) {
            Files.createDirectories(tmpFontsPath);
        }

        // Iterate through all font files and copy them to /tmp/fonts
        for (String fontFileName : fontFileNames) {
            try (InputStream fontFileStream = PdfGenerator.class.getResourceAsStream("/fonts/" + fontFileName)) {
                if (fontFileStream == null) {
                    throw new IOException("Font file not found in classpath: /fonts/" + fontFileName);
                }

                // Copy the font file to /tmp/fonts
                File targetFile = new File(tmpFontsDir + fontFileName);
                try (FileOutputStream outputStream = new FileOutputStream(targetFile)) {
                    byte[] buffer = new byte[1024];
                    int bytesRead;
                    while ((bytesRead = fontFileStream.read(buffer)) != -1) {
                        outputStream.write(buffer, 0, bytesRead);
                    }
                }
                System.out.println("Copied font: " + fontFileName + " to " + targetFile.getAbsolutePath());
            }
        }
    }


    public static void uploadPdfToInvoice(String accessToken, String tenantId, String invoiceId, byte[] pdfBytes, String fileName) throws IOException {
        try (CloseableHttpClient httpClient = HttpClients.createDefault()) {
            // Upload the file to Xero
            HttpPost fileUploadRequest = new HttpPost("https://api.xero.com/files.xro/1.0/Files");
            fileUploadRequest.setHeader("Authorization", "Bearer " + accessToken);
            fileUploadRequest.setHeader("Content-Type", ContentType.APPLICATION_OCTET_STREAM.getMimeType());
            fileUploadRequest.setHeader("xero-tenant-id", tenantId);
            fileUploadRequest.setHeader("Xero-File-Name", fileName);
            fileUploadRequest.setEntity(new ByteArrayEntity(pdfBytes, ContentType.APPLICATION_PDF));

            try (CloseableHttpResponse response = httpClient.execute(fileUploadRequest)) {
                System.out.println("File uploaded successfully. Response: " + response.getCode());
            }

            // Attach the file to the invoice
            HttpPut attachFileRequest = new HttpPut("https://api.xero.com/api.xro/2.0/Invoices/" + invoiceId + "/Attachments/" + fileName);
            attachFileRequest.setHeader("Authorization", "Bearer " + accessToken);
            attachFileRequest.setHeader("Content-Type", ContentType.APPLICATION_OCTET_STREAM.getMimeType());
            attachFileRequest.setHeader("xero-tenant-id", tenantId);
            attachFileRequest.setHeader("Content-Disposition", "attachment; filename=\"" + fileName + "\"");
            attachFileRequest.setEntity(new ByteArrayEntity(pdfBytes, ContentType.APPLICATION_PDF));

            try (CloseableHttpResponse response = httpClient.execute(attachFileRequest)) {
                System.out.println("File attached to invoice successfully. Response: " + response.getCode());
            }
        }
    }

    public static void main(String[] args) {
        new PdfGenerator().execute();
    }

    public void e2() {
        try {
            TransformerFactory factory = TransformerFactory.newInstance();
            Transformer transformer = factory.newTransformer(new StreamSource(new StringReader(
                    "<xsl:stylesheet version=\"2.0\" xmlns:xsl=\"http://www.w3.org/1999/XSL/Transform\">" +
                            "<xsl:template match=\"/\">" +
                            "<test><xsl:value-of select=\"upper-case('hello world')\"/></test>" +
                            "</xsl:template>" +
                            "</xsl:stylesheet>"
            )));
            StringWriter writer = new StringWriter();
            transformer.transform(new StreamSource(new StringReader("<root/>")), new StreamResult(writer));
            System.out.println(writer.toString());
        } catch (TransformerException e) {
            throw new RuntimeException(e);
        } finally {
        }
    }

    private Document getXML() {
        try {
//            String xmlString = "<note><to>User</to><from>Library</from><heading>Example</heading><body>This is an example</body></note>";

            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            DocumentBuilder builder = factory.newDocumentBuilder();

            // Parse the XML string
            InputSource is = new InputSource(new StringReader(xmlString));
            Document document = builder.parse(is);

            // Additional null check
            if (document != null) {
                System.out.println("Root element: " + document.getDocumentElement().getNodeName());
            } else {
                System.out.println("Document is null.");
            }
            return document;
        } catch (Exception e) {
            System.out.println("An error occurred during XML parsing.");
            e.printStackTrace();
            return null;
        }
    }

    public static Map<String, String> getTokensFromSecretsManager() {
        SecretsManagerClient secretsManager = SecretsManagerClient.builder()
                .region(Region.of(REGION))
                .credentialsProvider(EnvironmentVariableCredentialsProvider.create())
                .build();

        try {
            GetSecretValueRequest getSecretValueRequest = GetSecretValueRequest.builder()
                    .secretId(SECRET_NAME)
                    .build();

            GetSecretValueResponse getSecretValueResponse = secretsManager.getSecretValue(getSecretValueRequest);
            String secretString = getSecretValueResponse.secretString();

            JsonNode secretJson = OBJECT_MAPPER.readTree(secretString);
            Map<String, String> tokens = new HashMap<>();
            tokens.put("access_token", secretJson.get("access_token").asText());
            tokens.put("refresh_token", secretJson.get("refresh_token").asText());

            return tokens;
        } catch (SecretsManagerException | IOException e) {
            throw new RuntimeException("Failed to retrieve tokens from Secrets Manager", e);
        }
    }

    public static String refreshAccessTokenIfNeeded(String accessToken, String refreshToken) throws IOException {
        try (CloseableHttpClient httpClient = HttpClients.createDefault()) {
            HttpPost tokenRequest = new HttpPost(TOKEN_URL);
            tokenRequest.setHeader("Content-Type", ContentType.APPLICATION_FORM_URLENCODED.getMimeType());

            StringEntity requestBody = new StringEntity(
                    "grant_type=refresh_token" +
                            "&refresh_token=" + refreshToken +
                            "&client_id=" + CLIENT_ID +
                            "&client_secret=" + CLIENT_SECRET,
                    StandardCharsets.UTF_8);

            tokenRequest.setEntity(requestBody);

            try (CloseableHttpResponse response = httpClient.execute(tokenRequest)) {
                int statusCode = response.getCode();

                if (statusCode >= 200 && statusCode < 300) {
                    JsonNode responseBody = OBJECT_MAPPER.readTree(response.getEntity().getContent());
                    String newAccessToken = responseBody.get("access_token").asText();
                    String newRefreshToken = responseBody.get("refresh_token").asText();

                    // Update the tokens in Secrets Manager
                    updateTokensInSecretsManager(newAccessToken, newRefreshToken);

                    return newAccessToken;
                } else {
                    throw new RuntimeException("Failed to refresh access token: HTTP " + statusCode);
                }
            }
        }
    }

    public static void updateTokensInSecretsManager(String accessToken, String refreshToken) {
        SecretsManagerClient secretsManager = SecretsManagerClient.builder()
                .region(Region.of(REGION))
                .build();

        Map<String, String> updatedTokens = new HashMap<>();
        updatedTokens.put("access_token", accessToken);
        updatedTokens.put("refresh_token", refreshToken);

        try {
            String updatedSecretString = OBJECT_MAPPER.writeValueAsString(updatedTokens);
            secretsManager.putSecretValue(r -> r.secretId(SECRET_NAME).secretString(updatedSecretString));
        } catch (SecretsManagerException | IOException e) {
            throw new RuntimeException("Failed to update tokens in Secrets Manager", e);
        }
    }

    private String xmlString = "<?xml version='1.0'?><Invoice>    <tenant>        <address2/>        <city>Sandy Bay</city>        <phone>0407 357 397</phone>        <address1>410 Sandy Bay Rd</address1>        <primaryContact>Michael Giizel</primaryContact>        <name>Federal Group (Tas Keno)</name>        <postcode>7005</postcode>        <id>986922ea-0eb2-4ca4-ab88-904021866c3b</id>        <state>TAS</state>        <email>mgiizel@federalgroup.com.au</email>    </tenant>    <invoiceId>INV-1071</invoiceId>    <invoiceDate>15 Aug 2024</invoiceDate>    <dueDate>29 Aug 2024</dueDate>    <data>        <site>            <active>true</active>            <address>78 Formby Rd</address>            <address2>null</address2>            <city>DEVONPORT</city>            <email>null</email>            <id>27653fc5-c76b-4841-ba48-7f556786fa40</id>            <latitude>-41.18080030116688</latitude>            <longitude>146.3626935874797</longitude>            <name>Alexander Hotel</name>            <phone>+61364249427.0</phone>            <postcode>7310</postcode>            <state>TAS</state>        </site>        <siteTotal>285.48</siteTotal>        <assets>            <asset>                <FNN>N1044780R</FNN>                <POI>LAU</POI>                <active>true</active>                <carriageFNN>N/A</carriageFNN>                <carriagePort>N/A</carriagePort>                <carriageType>FTTN</carriageType>                <hostname>tkoaler01mlt6</hostname>                <id>2686b078-9259-4309-9b34-1997539257ba</id>                <loopbacks>172.27.244.0</loopbacks>                <routerDetails>                    <model>Chateau LTE6 - D53G-5HacD2HnD-TC&amp;FG621-EA</model>                    <serialNumber>null</serialNumber>                    <mobileDetails>                        <firstName>MobileBU</firstName>                        <lastName>tkoaler01mlt6</lastName>                        <password>Zf5Tz0Wp</password>                        <mobileNumber>null</mobileNumber>                        <PUK>null</PUK>                        <simSerial>8000 4508 9907 7N</simSerial>                        <framedIP>10.22.250.0</framedIP>                        <framedRoutes>10.22.4.0/29</framedRoutes>                        <framedRoutes>10.22.4.8/29</framedRoutes>                        <framedRoutes>172.27.244.0/32</framedRoutes>                        <username>aler01</username>                    </mobileDetails>                    <manufacturer>Mikrotik</manufacturer>                </routerDetails>                <terminals>2</terminals>                <wanSubnets>10.22.202.1/24</wanSubnets>            </asset>            <events>                <eventType>ACTIVATED</eventType>                <timestamp>10 July 2024</timestamp>                <rate>                    <name>Mikrotik Router with NBN and Mobile Backup</name>                    <id>7b1d6cca-8267-4fce-a56c-1d57190dd26c</id>                    <ongoing>55</ongoing>                    <upfront>200</upfront>                </rate>                <billingAmount>10.65</billingAmount>                <until>06 Aug 2024</until>            </events>            <events>                <eventType>DEACTIVATED</eventType>                <timestamp>06 Aug 2024</timestamp>                <rate>undefined</rate>                <billingAmount>10.65</billingAmount>                <until>undefined</until>            </events>            <events>                <eventType>ACTIVATED</eventType>                <timestamp>10 Aug 2024</timestamp>                <rate>                    <name>Mikrotik Router with NBN and Mobile Backup</name>                    <id>7b1d6cca-8267-4fce-a56c-1d57190dd26c</id>                    <ongoing>55</ongoing>                    <upfront>200</upfront>                </rate>                <billingAmount>207.10</billingAmount>                <until>13 Aug 2024</until>            </events>            <events>                <eventType>DEACTIVATED</eventType>                <timestamp>13 Aug 2024</timestamp>                <rate>undefined</rate>                <billingAmount>207.10</billingAmount>                <until>undefined</until>            </events>            <events>                <eventType>ACTIVATED</eventType>                <timestamp>22 Aug 2024</timestamp>                <rate>                    <name>Mikrotik Router with NBN and Mobile Backup</name>                    <id>7b1d6cca-8267-4fce-a56c-1d57190dd26c</id>                    <ongoing>55</ongoing>                    <upfront>50</upfront>                </rate>                <billingAmount>67.74</billingAmount>                <until>31 Aug 2024</until>            </events>            <billingAmount>285.48</billingAmount>            <wasActive>true</wasActive>        </assets>        <assets>            <asset>                <FNN>N1044780R</FNN>                <POI>LAU</POI>                <active>true</active>                <carriageFNN>N/A</carriageFNN>                <carriagePort>N/A</carriagePort>                <carriageType>FTTN</carriageType>                <hostname>tkoalem01d167</hostname>                <id>2686b078-9259-4309-9b34-1997539257bb</id>                <routerDetails>                    <model>Draytek 167</model>                    <serialNumber>-</serialNumber>                    <mobileDetails>                        <firstName/>                        <lastName/>                        <password/>                        <mobileNumber/>                        <PUK/>                        <simSerial/>                        <framedIP/>                        <username>a</username>                    </mobileDetails>                    <manufacturer>Draytek</manufacturer>                </routerDetails>                <terminals>null</terminals>            </asset>            <events>                <eventType>ACTIVATED</eventType>                <timestamp>27 Aug 2024</timestamp>                <rate>                    <name>Draytek VDSL Modem</name>                    <id>8dff6d32-8dc6-4e4d-a2c5-f1926bfb04d7</id>                    <ongoing>0</ongoing>                    <upfront>0</upfront>                </rate>                <billingAmount>0.00</billingAmount>                <until>27 Aug 2024</until>            </events>            <events>                <eventType>DEACTIVATED</eventType>                <timestamp>27 Aug 2024</timestamp>                <rate>undefined</rate>                <billingAmount>0.00</billingAmount>                <until>undefined</until>            </events>            <billingAmount>0.00</billingAmount>            <wasActive>false</wasActive>        </assets>    </data>    <data>        <site>            <active>true</active>            <address>56 Farrell St</address>            <address2>null</address2>            <city>TULLAH</city>            <email>null</email>            <id>9e5da5be-9d23-48ec-b6ca-2348ee67c411</id>            <latitude>-41.73612659893495</latitude>            <longitude>145.6122992000205</longitude>            <name>Tullah Lakeside Lodge</name>            <phone>+61362540078.0</phone>            <postcode>7321</postcode>            <state>TAS</state>        </site>        <siteTotal>55.00</siteTotal>        <assets>            <asset>                <FNN>null</FNN>                <POI>LAU</POI>                <active>true</active>                <carriageFNN>N/A</carriageFNN>                <carriagePort>N/A</carriagePort>                <carriageType>NextG</carriageType>                <hostname>tkotllr01mlt6</hostname>                <id>da838277-6f30-474b-89f8-2ba678e53987</id>                <loopbacks>172.27.244.141</loopbacks>                <routerDetails>                    <model>Chateau LTE6 - D53G-5HacD2HnD-TC&amp;FG621-EA</model>                    <serialNumber>HEY09D4H0P6</serialNumber>                    <mobileDetails>                        <firstName>null</firstName>                        <lastName>null</lastName>                        <password>MidlandsHoPass</password>                        <mobileNumber>409984272</mobileNumber>                        <PUK>13461829</PUK>                        <simSerial>8200 0883 2112 8N</simSerial>                        <framedIP>10.22.250.141</framedIP>                        <framedRoutes>10.22.7.112/29</framedRoutes>                        <framedRoutes>10.22.7.120/29</framedRoutes>                        <framedRoutes>172.27.244.141/32</framedRoutes>                        <username>midlandsho</username>                    </mobileDetails>                    <manufacturer>Mikrotik</manufacturer>                </routerDetails>                <terminals>1</terminals>                <wanSubnets>10.22.202.84/24</wanSubnets>            </asset>            <events>                <eventType>ACTIVATED</eventType>                <timestamp>15 July 2024</timestamp>                <rate>                    <name>Mikrotik Router with NBN and Mobile Backup</name>                    <id>7b1d6cca-8267-4fce-a56c-1d57190dd26c</id>                    <ongoing>55</ongoing>                    <upfront>200</upfront>                </rate>                <billingAmount>55.00</billingAmount>                <until>31 Aug 2024</until>            </events>            <billingAmount>55.00</billingAmount>            <wasActive>true</wasActive>        </assets>    </data>    <totalExGst>340.48</totalExGst>    <gst>34.05</gst>    <totalIncGst>374.53</totalIncGst>    <overdueIncGst>9823.00</overdueIncGst>    <totalDue>10197.53</totalDue>    <periodStartDate>01 Aug 2024</periodStartDate>    <periodEndDate>31 Aug 2024</periodEndDate></Invoice>";
}
