package au.com.blacksaltit.invoice.pdf;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.SQSEvent;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.fop.apps.FOPException;
import org.apache.fop.apps.FOUserAgent;
import org.apache.fop.apps.Fop;
import org.apache.fop.apps.FopFactory;
import org.apache.hc.client5.http.classic.methods.HttpGet;
import org.apache.hc.client5.http.classic.methods.HttpPost;
import org.apache.hc.client5.http.classic.methods.HttpPut;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.CloseableHttpResponse;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.core5.http.ContentType;
import org.apache.hc.core5.http.ParseException;
import org.apache.hc.core5.http.io.entity.ByteArrayEntity;
import org.apache.hc.core5.http.io.entity.EntityUtils;
import org.apache.hc.core5.http.io.entity.StringEntity;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.apache.xmlgraphics.util.MimeConstants;
import org.xml.sax.SAXException;
import software.amazon.awssdk.auth.credentials.EnvironmentVariableCredentialsProvider;
import software.amazon.awssdk.core.ResponseBytes;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.secretsmanager.SecretsManagerClient;
import software.amazon.awssdk.services.secretsmanager.model.GetSecretValueRequest;
import software.amazon.awssdk.services.secretsmanager.model.GetSecretValueResponse;
import software.amazon.awssdk.services.secretsmanager.model.SecretsManagerException;

import javax.xml.transform.*;
import javax.xml.transform.sax.SAXResult;
import javax.xml.transform.stream.StreamSource;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;



public class InvoiceGenerator implements RequestHandler<SQSEvent, Void> {
    private static final String SECRET_NAME = "xero-api-tokens";
    private static final String REGION = System.getenv("AWS_REGION");
    private static final String TOKEN_URL = "https://identity.xero.com/connect/token";
    private static final String CLIENT_ID = "B0E35429D87C4BD69BBE1BE7195D49A0";
    private static final String CLIENT_SECRET = "FxARTsteP8wKJwcmcypPH1S9NV2zZBzcUFYU2NhI0uInlAUD";
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final String CONNECTIONS_URL = "https://api.xero.com/connections";


    S3Client s3 = S3Client.builder()
            .region(Region.of(System.getenv("AWS_REGION")))
            .build();
    private static final Logger logger = LogManager.getLogger(InvoiceGenerator.class);
    //    private final FopFactory fopFactory = FopFactory.newInstance(new File(".").toURI());
    private FopFactory fopFactory;

    @Override
    public Void handleRequest(SQSEvent event, Context context) {
        try {
            copyFontsToTmp();
        } catch (IOException e) {
            logger.error("Error Copying Fonts: " + e.getMessage());
            throw new RuntimeException(e);
        }
        for (SQSEvent.SQSMessage msg : event.getRecords()) {
            String bucketName = System.getenv("INVOICE_BUCKET");
            System.out.println(bucketName);
            String key = "config/xslt/invoice.xsl";
            String messageGroupId = msg.getAttributes().get("MessageGroupId");
            String key2 = "complete/" + messageGroupId + ".pdf";
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();
            System.out.println(getObjectRequest.toString());
            System.out.println(msg.getBody());

            JsonNode jsonNode = null;
            try {
                jsonNode = OBJECT_MAPPER.readTree(msg.getBody());
            } catch (JsonProcessingException e) {
                throw new RuntimeException(e);
            }

            // Extract the values of the "xml" and "xeroInvoiceId" parameters
            String xml = jsonNode.get("xml").asText();
            String xeroInvoiceId = jsonNode.get("xeroInvoiceId").asText();

            ResponseBytes<GetObjectResponse> objectBytes = s3.getObjectAsBytes(getObjectRequest);
            String xsltContent = objectBytes.asUtf8String();
            ByteArrayOutputStream pdf = buildPDF(xsltContent, xml, messageGroupId);
            RequestBody requestBody = RequestBody.fromBytes(pdf.toByteArray());
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key2)
                    .build();
            s3.putObject(putObjectRequest, requestBody);

            Map<String, String> tokens = getTokensFromSecretsManager();
            String accessToken = tokens.get("access_token");
            String refreshToken = tokens.get("refresh_token");

            try {
                accessToken = refreshAccessTokenIfNeeded(accessToken, refreshToken);
                String tenantId = getTenantId(accessToken);
                uploadPdfToInvoice(accessToken,tenantId, xeroInvoiceId, pdf.toByteArray(), messageGroupId + ".pdf");
            } catch (IOException e) {
                throw new RuntimeException(e);
            }



        }
        return null;
    }

    public ByteArrayOutputStream buildPDF(String xslt, String xml, String gameId) {
        try {
            InputStream fopConfig = getClass().getResourceAsStream("/fop.xconf");
            fopFactory = FopFactory.newInstance(new File("/tmp").toURI(), fopConfig);
            fopFactory.getFontManager().disableFontCache();
//                    setFontBaseURL(getClass().getResource("/fonts/").toURI().toString());

            System.setProperty("javax.xml.transform.TransformerFactory", "net.sf.saxon.TransformerFactoryImpl");
            Source xsltSrc = new StreamSource(new StringReader(xslt));
            TransformerFactory tFactory = TransformerFactory.newInstance();
            Transformer transformer = tFactory.newTransformer(xsltSrc);
            ByteArrayOutputStream pdfOut = new ByteArrayOutputStream();
            FOUserAgent foUserAgent = fopFactory.newFOUserAgent();
//            InputStream fopConfig = getClass().getResourceAsStream("/fop.xconf");
//            FopFactory fopFactory = FopFactory.newInstance(fopConfig);
//
//// Assuming fonts are in /fonts/ directory in resources
//            File fontFile = new File(getClass().getResource("/fonts/CustomFont-Regular.ttf").toURI());

            Fop fop = fopFactory.newFop(MimeConstants.MIME_PDF, foUserAgent, pdfOut);
            Source src = new StreamSource(new StringReader(xml));
            Result res = new SAXResult(fop.getDefaultHandler());
            transformer.transform(src, res);
            return pdfOut;
        } catch (TransformerException ex) {
            logger.error("Error Transforming xml [" + gameId + "]: " + ex.getMessage());
            throw new RuntimeException("Transformation Error");
        } catch (FOPException ex) {
            logger.error("Fop Error [" + gameId + "]: " + ex.getMessage());
            throw new RuntimeException("FOP Error");
        } catch (Error e) {
            logger.error("Error Processing PDF [" + gameId + "]: " + e.getMessage());
        } catch (IOException e) {
            throw new RuntimeException(e);
        } catch (SAXException e) {
            logger.error("Error Processing PDF [" + gameId + "]: " + e.getMessage());
        }
        return null;
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
            try (InputStream fontFileStream = InvoiceGenerator.class.getResourceAsStream("/fonts/" + fontFileName)) {
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
            System.out.println(tenantId);
            System.out.println(accessToken);
            // Upload the file to Xero
//            HttpPost fileUploadRequest = new HttpPost("https://api.xero.com/files.xro/1.0/Files");
//            fileUploadRequest.setHeader("Authorization", "Bearer " + accessToken);
//            fileUploadRequest.setHeader("Content-Type", ContentType.APPLICATION_PDF );
//            fileUploadRequest.setHeader("Xero-Tenant-Id", tenantId);
//            fileUploadRequest.setHeader("Xero-File-Name", fileName);
//            fileUploadRequest.setEntity(new ByteArrayEntity(pdfBytes, ContentType.APPLICATION_PDF));
//
//            try (CloseableHttpResponse response = httpClient.execute(fileUploadRequest)) {
//                System.out.println("File uploaded successfully. Response: " + response.getCode());
//                String responseBody = EntityUtils.toString(response.getEntity());
//                System.out.println("Response Body: " + responseBody);
//            } catch (ParseException e) {
//                throw new RuntimeException(e);
//            }

            // Attach the file to the invoice
            System.out.println(fileName);
            HttpPut attachFileRequest = new HttpPut("https://api.xero.com/api.xro/2.0/Invoices/" + invoiceId + "/Attachments/" + fileName);
            attachFileRequest.setHeader("Authorization", "Bearer " + accessToken);
            attachFileRequest.setHeader("Content-Type", "application/octet-stream");
            attachFileRequest.setHeader("Xero-Tenant-Id", tenantId);
            attachFileRequest.setHeader("Content-Disposition", "attachment; filename=\"" + fileName + "\"");
            attachFileRequest.setEntity(new ByteArrayEntity(pdfBytes, ContentType.APPLICATION_PDF));

            System.out.println(attachFileRequest.toString());

            try (CloseableHttpResponse response = httpClient.execute(attachFileRequest)) {
                System.out.println("File attached to invoice successfully. Response: " + response.getCode());
                String responseBody = EntityUtils.toString(response.getEntity());
                System.out.println("Response Body: " + responseBody);            } catch (ParseException e) {
                throw new RuntimeException(e);
            }
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

    public static String getTenantId(String accessToken) throws IOException {
        try (CloseableHttpClient httpClient = HttpClients.createDefault()) {
            // Create a GET request to the connections endpoint
            HttpGet request = new HttpGet(CONNECTIONS_URL);
            request.setHeader("Authorization", "Bearer " + accessToken);
            request.setHeader("Content-Type", "application/json");

            // Execute the request
            try (CloseableHttpResponse response = httpClient.execute(request)) {
                int statusCode = response.getCode();
                if (statusCode >= 200 && statusCode < 300) {
                    // Parse the response body
                    String responseBody = EntityUtils.toString(response.getEntity());
                    JsonNode jsonNode = OBJECT_MAPPER.readTree(responseBody);

                    if (jsonNode.isArray() && jsonNode.size() > 0) {
                        // Return the tenantId from the first connection
                        return jsonNode.get(0).get("tenantId").asText();
                    } else {
                        throw new RuntimeException("No tenants found for this access token.");
                    }
                } else {
                    throw new RuntimeException("Failed to retrieve tenant ID: HTTP " + statusCode);
                }
            } catch (ParseException e) {
                throw new RuntimeException(e);
            }
        }
    }

}
