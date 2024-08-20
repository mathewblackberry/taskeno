package au.com.blacksaltit.invoice.pdf;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.SQSEvent;
import org.apache.fop.apps.FOPException;
import org.apache.fop.apps.FOUserAgent;
import org.apache.fop.apps.Fop;
import org.apache.fop.apps.FopFactory;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.apache.xmlgraphics.util.MimeConstants;
import org.xml.sax.SAXException;
import software.amazon.awssdk.core.ResponseBytes;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import javax.xml.transform.*;
import javax.xml.transform.sax.SAXResult;
import javax.xml.transform.stream.StreamSource;
import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;


public class InvoiceGenerator implements RequestHandler<SQSEvent, Void> {
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
//            System.out.println(msg.getBody());
            ResponseBytes<GetObjectResponse> objectBytes = s3.getObjectAsBytes(getObjectRequest);
            String xsltContent = objectBytes.asUtf8String();
            ByteArrayOutputStream pdf = buildPDF(xsltContent, msg.getBody(), messageGroupId);
            RequestBody requestBody = RequestBody.fromBytes(pdf.toByteArray());
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key2)
                    .build();
            s3.putObject(putObjectRequest, requestBody);
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
                "MaterialIcons-Regular.ttf"
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

}
