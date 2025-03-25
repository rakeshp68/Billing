import { useState } from "react";
import axios from "axios";
import {
  Box,
  Card,
  Layout,
  Page,
  Text,
  Button,
  FormLayout,
  TextField,
  Banner
} from "@shopify/polaris";
import { json } from "@remix-run/node";
import { useFetcher , useLoaderData } from "@remix-run/react";
import db from "../db.server";
import nodemailer from 'nodemailer';

// get load customber_app_support table data
export async function loader() {
  const customerSessions = await db.session.findMany();
  const customerSupportData = await db.customber_app_support.findMany();

  if (!customerSessions.length) {
    return json({ error: "No session found" });
  }

  const shop = customerSessions[0].shop;
  const shopName = shop.replace(/\.myshopify\.com$/, "");
  const accessToken = customerSessions[0].accessToken;

//   console.log( "shop:", shop);
//   console.log( "shopName:", shopName);
//   console.log( "accessToken:", accessToken);

  let shopDetails = { name: "", email: "" };

 // console.log("response:", shopDetails);

  try {
    const response = await axios.get(`https://${shop}/admin/api/2024-01/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': accessToken, // Use the valid access token here
        "Content-Type": "application/json",
        Accept: "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Origin, Content-Type, X-Auth-Token",
      },
    });
    // console.log("response:", response);
    // console.log("Shop shop_owner:", response.data.shop.shop_owner);
    // console.log("Shop email:", response.data.shop.email);
    shopDetails = {
      name: response.data.shop.shop_owner,
      email: response.data.shop.email,
    };
  } catch (error) {
    console.error("Error fetching shop details:", error.response?.data || error);
  }
  return json({ customerSupportData, shopDetails });
}


// get load action table data create and error check
export async function action({ request }) {
  let errors = {};
  const formData = await request.formData();
  const name = formData.get("name");
  const email = formData.get("email");
  const message = formData.get("message");

  if (!name) errors.name = "Name is required";
  if (!email) errors.email = "Email is required";
  else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) errors.email = "Invalid email format";
  }
  if (!message) errors.message = "Message is required";

  if (Object.keys(errors).length > 0) {
    return json({ success: false, errors });
  }
  // Save to DB
  await db.customber_app_support.create({
    data: { name, email, message },
  });

  // Nodemailer setup
  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'darshanpdolphinwebsolutions@gmail.com',
      pass: 'pgcs apgm ggei khyr'
    }
  });

  // Send email
  var mailOptions = {
    from: 'darshanpdolphinwebsolutions@gmail.com',
    to: 'vivek@dolphinwebsolution.com,ramlakshman918@gmail.com',
    subject: 'Sending Email using Node.js',
    text: message //  You can include the message in the email body
  };

  try {
    await transporter.sendMail(mailOptions);
    return json({ success: true });
  } catch (error) {
    console.error("Error sending email:", error);
    return json({ success: false, errors: { email: "Failed to send email notification" } });
  }
}

export default function Customsupports() {
  const { shopDetails } = useLoaderData(); // Get shop data
  const fetcher = useFetcher(); // Fetcher for form submission
  const [name, setName] = useState(shopDetails.name || ""); // Name state
  const [email, setEmail] = useState(shopDetails.email || ""); // Email state
  const [message, setMessage] = useState(""); // Message state
  const [errors, setErrors] = useState({}); // Error state
  const [isSubmitting, setIsSubmitting] = useState(false); // Submitting state
  const [success, setSuccess] = useState(false); // Success state

  const handleSubmit = (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    let newErrors = {};

    if (!name) newErrors.name = "Name is required";
    if (!email) newErrors.email = "Email is required";
    else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) newErrors.email = "Invalid email format";
    }
    if (!message) newErrors.message = "Message is required";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0){
      setIsSubmitting(false);
      return;
    }

    fetcher.submit(
      { name, email, message },
      { method: "post" }
    );
    // Toast message
    shopify.toast.show('Message sent', {
      duration: 5000,
    });

    setSuccess(true);
  };

  const handleBannerAction = (event) => {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(false);
    setSuccess(false);
  };

  return (
    <Page
      backAction={{ content: 'Settings', url: '/app' }}
      title="Support"
      narrowWidth
      primaryAction={<Button onClick={handleSubmit} variant="primary">Submit</Button>}
    >
      <Layout>
        <Layout.Section>
          {success && (
            <Banner
              title="Support Request Successfully Submitted"
              tone="success"
              action={{
                content: "Send another request",
                onAction: handleBannerAction,
              }}
              onDismiss={() => { }}
            />
          )}
        </Layout.Section>
        <Layout.Section>
          <Card roundedAbove="sm">
            <Text as="h2" variant="headingSm">
              Get in touch
            </Text>
            <Box paddingBlockStart="200" paddingBlockEnd="500">
              <Text as="p" variant="bodyMd">
                We would be happy to help with every inquiry you may have, simply complete this form.
              </Text>
            </Box>
            <FormLayout>
              <FormLayout.Group>
                <TextField
                  type="text"
                  label="Your name"
                  value={name}
                  onChange={setName}
                  autoComplete="off"
                  error={errors.name}
                  disabled={isSubmitting}
                  requiredIndicator
                />
                <TextField
                  type="email"
                  label="Your email"
                  value={email}
                  onChange={setEmail}
                  autoComplete="email"
                  disabled={isSubmitting}
                  readOnly
                />
              </FormLayout.Group>
              <TextField
                  label="Message"
                  value={message}
                  onChange={setMessage}
                  multiline={4}
                  autoComplete="off"
                  error={errors.message}
                  disabled={isSubmitting}
                  requiredIndicator
                />
            </FormLayout>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
