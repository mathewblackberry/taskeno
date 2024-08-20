package au.com.blacksaltit.invoice.pdf;

import javax.xml.transform.Source;
import javax.xml.transform.TransformerException;
import javax.xml.transform.URIResolver;
import javax.xml.transform.stream.StreamSource;
import java.io.InputStream;

public class MixedURIResolver implements URIResolver {
    @Override
    public Source resolve(String href, String base) throws TransformerException {
        System.out.println("Resolver");
        if (href.startsWith("classpath:")) {
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
}

